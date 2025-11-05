// src/components/Quest1.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Text,
  VStack,
  Progress,
  Badge,
  Divider,
  usePrefersReducedMotion,
} from "@chakra-ui/react";
import { PIXEL_PALETTE as C } from "../pixelpalette";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (report: Report) => void;
  mode?: "edu" | "arcade";
  incomeKRW?: number;
};

type KPIs = { happy: number; health: number; stability: number };
type Bag = Record<string, number>;
type Drop = {
  key: string; emoji: string; color: string; price: number;
  x: number; y: number; vy: number; r: number;
};

type Report = {
  remainKRW: number;
  requiredOk: boolean;
  kpis: KPIs;
  bag: Bag;
};

// ------------ 테마 색상 (팔레트 기반) ------------
const FRAME_BG = `${C.tileLight}`;
const FRAME_BORDER = `${C.border}`;
const INNER_BORDER = `${C.border}`;
const CARD_BG = `${C.ribbon}`;
const TEXT_INK = `${C.ink}`;
const LABEL_BG = `${C.ribbon}`;
const LABEL_TEXT = `${C.ink}`;
const GLASS_BG = `${C.tileLight}F2`;

// ------------ 게임 설정 ------------
const CONFIG = {
  INCOME_MANWON: 180,             // 만원
  DURATION_SEC: 75,
  BASE_DROP_EVERY_MS: 900,
  ARCADE_MIN_MS: 450,
  CART_SPEED: 8,
  REQUIRED_KEYS: ["home", "food", "net"],
  ITEMS: [
    { key:"home",  name:"주거비", emoji:"🏠", price:50, color:"#fca5a5", hint:"보증금/월세/관리비 포함 패키지" },
    { key:"food",  name:"식비",   emoji:"🥦", price:30, color:"#86efac", hint:"최소 25~35만 구간 가산점" },
    { key:"net",   name:"통신",   emoji:"📶", price:6,  color:"#93c5fd", hint:"인터넷/통신" },
    { key:"fun",   name:"여가",   emoji:"🎉", price:10, color:"#c4b5fd", hint:"행복 지수에 기여" },
    { key:"save",  name:"저축",   emoji:"💰", price:20, color:"#fde68a", hint:"안정성 지수에 기여" },
    { key:"move",  name:"교통",   emoji:"🚌", price:8,  color:"#67e8f9", hint:"출퇴근 비용" },
  ],
  SCORE: {
    happy: (bag: Bag) => {
      const fun = bag.fun||0; const food = bag.food||0;
      let score = fun*5;
      if (food>=25 && food<=35) score += 10;
      if (!bag.fun) score -= 10;
      return clamp(score, 0, 100);
    },
    health: (bag: Bag) => {
      const food = bag.food||0;
      let s = food*3;
      if (food<25) s -= 10;
      return clamp(s, 0, 100);
    },
    stability: (bag: Bag) => {
      const save = bag.save||0; const home = bag.home||0;
      let base = save*4;
      if (home <= 45 && home>0) base += 5;
      if (home >= 60) base -= 5;
      if (!save) base -= 10;
      return clamp(base, 0, 100);
    },
  },
};

// ------------ 유틸 ------------
const toKRW = (manwon:number) => (manwon*10000).toLocaleString("ko-KR") + "원";
const clamp = (v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
function mulberry32(seed:number){
  return function(){
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

// ============= 컴포넌트 =============
export default function Quest1({
  isOpen,
  onClose,
  onFinish,
  mode="edu",
  incomeKRW = 1_800_000,
}: Props) {
  const reduce = usePrefersReducedMotion();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  // UI state
  const [incomeManwon] = useState(Math.round(incomeKRW/10000));
  const [spentManwon, setSpentManwon] = useState(0);
  const [bag, setBag] = useState<Bag>({});
  const [reqCount, setReqCount] = useState(0);
  const [overBudget, setOverBudget] = useState(false);

  const kpis = useMemo<KPIs>(() => ({
    happy: CONFIG.SCORE.happy(bag),
    health: CONFIG.SCORE.health(bag),
    stability: CONFIG.SCORE.stability(bag),
  }), [bag]);

  // 내부 게임 상태
  const stateRef = useRef({
    width: 900, height: 520,              // 논리 해상도(고정)
    cart: { x: 900/2, y: 520-32, w: 120, h: 22 },
    keys: new Set<string>(),
    timer: 0,
    nextDrop: 0,
    drops: [] as Drop[],
    rng: mode === "edu" ? mulberry32(777) : Math.random,
    pool: [] as string[],
  });

  const lastTimeRef = useRef<number | null>(null);

  // 고정 시퀀스
  const buildFixed = () => {
    const order = ["home","food","net","save","move","fun"];
    const seq:string[] = [];
    for (let i=0;i<60;i++) seq.push(order[i%order.length]);
    return seq;
  };

  // 초기화
  useEffect(() => {
    if (!isOpen) return;
    const st = stateRef.current;
    st.pool = mode === "edu" ? buildFixed() : [];
    st.timer = 0; st.nextDrop = 0; st.drops = [];
    st.keys.clear();
    st.cart = { x: st.width/2, y: st.height-32, w: 120, h: 22 };
    setSpentManwon(0);
    setBag({});
    setReqCount(0);
    setOverBudget(false);
    setRunning(false);
    setPaused(false);
    setShowOverlay(true);
    lastTimeRef.current = null;
    // 캔버스 초기 스케일
    resizeCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode]);

  // 반응형/고DPI 캔버스
  const resizeCanvas = () => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ratio = (window.devicePixelRatio || 1);
    const st = stateRef.current;
    // 실제 캔버스 픽셀 크기
    cvs.width = Math.floor(st.width * ratio);
    cvs.height = Math.floor(st.height * ratio);
    const ctx = cvs.getContext("2d");
    if (ctx) {
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0); // 논리 좌표 → 픽셀 스케일
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const onRz = () => resizeCanvas();
    window.addEventListener("resize", onRz);
    return () => window.removeEventListener("resize", onRz);
  }, [isOpen]);

  // 입력
  useEffect(() => {
    if (!isOpen) return;
    const st = stateRef.current;
    const cvs = canvasRef.current!;
    const keyDown = (e:KeyboardEvent) => {
      if (["ArrowLeft","ArrowRight"].includes(e.key)) st.keys.add(e.key);
      if (e.key === " "){ e.preventDefault(); if (running) setPaused(p => !p); else start(); }
      if (e.key === "p" || e.key === "P"){ if (running) setPaused(p => !p); }
      if (e.key === "Escape"){ onClose(); }
    };
    const keyUp = (e:KeyboardEvent) => {
      if (["ArrowLeft","ArrowRight"].includes(e.key)) st.keys.delete(e.key);
    };
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    const moveTo = (clientX:number) => {
      const rect = cvs.getBoundingClientRect();
      const x = (clientX-rect.left)/rect.width * st.width;
      st.cart.x = clamp(x, st.cart.w/2, st.width-st.cart.w/2);
    };
    const mm = (e:MouseEvent)=> moveTo(e.clientX);
    const md = (e:MouseEvent)=> moveTo(e.clientX);
    const ts = (e:TouchEvent)=> moveTo(e.touches[0].clientX);
    const tm = (e:TouchEvent)=> moveTo(e.touches[0].clientX);

    cvs.addEventListener("mousemove", mm);
    cvs.addEventListener("mousedown", md);
    cvs.addEventListener("touchstart", ts, { passive:true });
    cvs.addEventListener("touchmove", tm, { passive:true });

    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      cvs.removeEventListener("mousemove", mm);
      cvs.removeEventListener("mousedown", md);
      cvs.removeEventListener("touchstart", ts as any);
      cvs.removeEventListener("touchmove", tm as any);
    };
  }, [isOpen, running, onClose]);

  // 루프
  useEffect(() => {
    if (!isOpen || !running || paused) return;
    let raf = 0;
    const loop = (now: number) => {
      const last = lastTimeRef.current ?? now;
      const dt = now - last; // ms
      lastTimeRef.current = now;
      step(dt);
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, running, paused, bag, spentManwon]);

  const start = () => {
    setShowOverlay(false);
    setRunning(true);
    setPaused(false);
    lastTimeRef.current = null;
  };

  const finish = () => {
    setRunning(false);
    const remain = incomeManwon - spentManwon;
    const requiredOk = CONFIG.REQUIRED_KEYS.every(k => (bag[k]||0) > 0);
    onFinish({
      remainKRW: remain*10000,
      requiredOk,
      kpis,
      bag,
    });
  };

  // ======= 게임 로직 =======
  const step = (dt:number) => {
    const st = stateRef.current;

    // 이동 (dt 보정)
    const stepPx = CONFIG.CART_SPEED * (dt / 16.6667);
    if (st.keys.has("ArrowLeft"))  st.cart.x -= stepPx;
    if (st.keys.has("ArrowRight")) st.cart.x += stepPx;
    st.cart.x = clamp(st.cart.x, st.cart.w/2, st.width-st.cart.w/2);

    // 타이머/스폰
    st.timer += dt;
    if (mode === "edu") {
      if (st.timer > st.nextDrop) {
        st.drops.push(spawn(st));
        st.nextDrop = st.timer + CONFIG.BASE_DROP_EVERY_MS;
      }
    } else {
      const speed = Math.max(CONFIG.ARCADE_MIN_MS, 1100 - Math.floor(st.timer/10));
      if (st.timer > st.nextDrop) {
        st.drops.push(spawn(st));
        st.nextDrop = st.timer + speed;
      }
    }

    // 드롭 이동/충돌
    st.drops.forEach(d => { d.y += d.vy * (dt / 16.6667); });
    st.drops = st.drops.filter(d => {
      const hit = collide(st.cart, d);
      if (hit) { addItem(d.key); return false; }
      return d.y < st.height + 40;
    });

    // 종료 조건(교육)
    if (mode === "edu") {
      const sec = st.timer/1000;
      if (sec >= CONFIG.DURATION_SEC || (st.pool.length===0 && st.drops.length===0)) {
        setRunning(false);
      }
    }
  };

  const addItem = (key:string) => {
    const it = CONFIG.ITEMS.find(i => i.key === key)!;
    const next = spentManwon + it.price;
    if (next > incomeManwon) {
      setOverBudget(true);
      setTimeout(()=> setOverBudget(false), 600);
      return;
    }
    setSpentManwon(next);
    setBag(prev => {
      const nv = { ...prev, [key]: (prev[key]||0) + it.price };
      const reqGot = CONFIG.REQUIRED_KEYS.filter(k => (nv[k]||0)>0).length;
      setReqCount(reqGot);
      return nv;
    });
  };

  const spawn = (st: typeof stateRef.current): Drop => {
    const pickKey = () => {
      if (mode === "edu") return st.pool.shift()!;
      const idx = Math.floor(st.rng()*CONFIG.ITEMS.length);
      return CONFIG.ITEMS[idx].key;
    };
    const key = pickKey();
    const it = CONFIG.ITEMS.find(i=>i.key===key)!;
    const x = Math.floor(st.rng()*(st.width-60))+30;
    const vy = mode==='arcade' ? 2.5 + (st.rng()*2.5) : 2.2;
    return { key: it.key, emoji: it.emoji, color: it.color, price: it.price, x, y:-20, vy, r: 18 };
  };

  const collide = (cart:{x:number;y:number;w:number;h:number}, d:Drop) => {
    const withinX = Math.abs(d.x - cart.x) < (cart.w/2);
    const withinY = (cart.y - d.y) < d.r + 6 && Math.abs(d.y - cart.y) < 26;
    return withinX && withinY;
  };

  // ======= 렌더링 =======
  const draw = () => {
    const st = stateRef.current;
    const cvs = canvasRef.current!;
    const ctx = cvs.getContext("2d")!;
    ctx.clearRect(0,0,st.width,st.height);

    // 보라/핑크 그라데이션 배경
    const grad = ctx.createLinearGradient(0,0,0,st.height);
    grad.addColorStop(0, C.tileLight);
    grad.addColorStop(1, C.tileMid);
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,st.width,st.height);

    // 은은한 라인
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    for(let y=40;y<st.height-40;y+=40){
      ctx.globalAlpha = 0.15;
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(st.width,y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 드롭
    stateRef.current.drops.forEach(d => drawDrop(ctx, d));

    // 카트
    drawCart(ctx, st.cart);
  };

  const drawCart = (ctx:CanvasRenderingContext2D, cart:{x:number;y:number;w:number;h:number}) => {
    const {x,y,w,h} = cart;
    ctx.fillStyle = TEXT_INK;
    ctx.fillRect(x-w/2, y-h/2, w, h);
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y-h/2, 18, Math.PI, 0);
    ctx.stroke();
  };

  const drawDrop = (ctx:CanvasRenderingContext2D, d:Drop) => {
    roundRect(ctx, d.x-26, d.y-22, 52, 44, 10, true, true, CARD_BG, C.border);
    ctx.font = "22px system-ui, Apple Color Emoji, Segoe UI Emoji";
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillStyle = TEXT_INK;
    ctx.fillText(d.emoji, d.x, d.y-2);

    roundRect(ctx, d.x-20, d.y+10, 40, 16, 6, true, true, C.tileMid, C.border);
    ctx.fillStyle = C.border;
    ctx.font = "10px system-ui";
    ctx.fillText(`${d.price}만`, d.x, d.y+18);
  };

  const roundRect = (
    ctx:CanvasRenderingContext2D, x:number,y:number,w:number,h:number,r:number,
    fill=true, stroke=true, fillColor="#ffffff", strokeColor="#cbd5e1"
  ) => {
    const rr = {tl:r,tr:r,br:r,bl:r};
    ctx.beginPath();
    ctx.moveTo(x + rr.tl, y);
    ctx.lineTo(x + w - rr.tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr.tr);
    ctx.lineTo(x + w, y + h - rr.br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr.br, y + h);
    ctx.lineTo(x + rr.bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr.bl);
    ctx.lineTo(x, y + rr.tl);
    ctx.quadraticCurveTo(x, y, x + rr.tl, y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fillColor; ctx.fill(); }
    if (stroke){ ctx.strokeStyle = strokeColor; ctx.stroke(); }
  };

  // ======= JSX =======
  if (!isOpen) return null;

  return (
    // === 이전 모달과 동일한 '배경 오버레이' 래퍼 ===
    <Box
      position="fixed"
      inset={0}
      zIndex={1000}
      role="dialog"
      aria-modal="true"
      _before={{
        content: '""',
        position: "absolute",
        inset: 0,
        backgroundImage: "url('/assets/background/quest1_back.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      _after={{
        content: '""',
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        boxShadow: `inset 0 0 200px ${C.shadow}`,
        backgroundImage: reduce
          ? undefined
          : "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 2px, transparent 4px)",
        mixBlendMode: "overlay",
        opacity: 0.34,
      }}
    >
      {/* 메인 컨테이너 */}
      <Box
        position="absolute"
        left="50%"
        top="50%"
        transform="translate(-50%, -50%)"
        bg={FRAME_BG}
        border={`3px solid ${FRAME_BORDER}`}
        borderRadius="18px"
        boxShadow={`0 10px 30px ${C.shadow}`}
        pt={`max(56px, calc(env(safe-area-inset-top) + 32px))`}
        px={[3,4]}
        pb={`max(12px, env(safe-area-inset-bottom))`}
        w={["92%", "980px"]}
      >
        {/* 상단 퀘스트 라벨 */}
        <Box
          position="absolute"
          top={`max(10px, env(safe-area-inset-top))`}
          left="14px"
          bg={LABEL_BG}
          border={`3px solid ${FRAME_BORDER}`}
          borderRadius="10px"
          px={3}
          py={0.5}
          zIndex={3}
        >
          <Text fontSize="sm" fontWeight="bold" color={LABEL_TEXT}>
            QUEST 1
          </Text>
        </Box>

        <Flex gap={4} align="stretch">
          {/* 좌: 캔버스 카드 */}
          <Box
            position="relative"
            ref={containerRef}
            bg={CARD_BG}
            rounded="md"
            border={`3px solid ${INNER_BORDER}`}
            p={2}
          >
            {/* 고정 논리 해상도 900x520, CSS로 축소/확대 */}
            <canvas
              ref={canvasRef}
              width={900}
              height={520}
              style={{
                width: "640px",             // 데스크탑 권장 표시 폭
                height: `${(520/900)*640}px`,
                maxWidth: "min(92vw, 700px)",// 모바일에서 자동 축소
                display:"block",
                borderRadius: 8
              }}
            />
            {/* 오버레이(시작/안내) */}
            {showOverlay && (
              <Flex
                position="absolute"
                left="12px"
                top="19px"
                w="calc(100% - 24px)"
                h="calc(100% - 38px)"
                align="center"
                justify="center"
              >
                <VStack
                  bg={GLASS_BG}
                  rounded="md"
                  border={`3px solid ${INNER_BORDER}`}
                  p={[4,5]}
                  maxW="520px"
                  textAlign="center"
                  spacing={3}
                >
                  <Heading size="md" color={TEXT_INK}>
                    장바구니를 ← → 로 움직여 과일(예산 항목)을 담아보세요!
                  </Heading>
                  <Text color={C.border}>
                    소득 한도({toKRW(incomeManwon)}) 안에서 필수 과일(주거·식비·통신)을 반드시 포함해야 합니다.
                  </Text>
                  <HStack pt={1}>
                    <Button colorScheme="purple" onClick={start}>
                      시작하기 (Space)
                    </Button>
                    <Button
                      variant="outline"
                      borderColor={C.border}
                      color={C.border}
                      _hover={{ bg: C.ribbon }}
                      onClick={() =>
                        alert(
                          "규칙\n1) 과일은 예산 항목입니다. 담으면 가격만큼 차감됩니다.\n2) 필수: 주거·식비·통신(각 1개 이상), 예산 초과는 담기지 않아요.\n3) 행복/건강/안정성 지수는 담은 항목으로 계산됩니다."
                        )
                      }
                    >
                      규칙 보기
                    </Button>
                  </HStack>
                  <Text fontSize="xs" opacity={0.7} color={C.border}>
                    Space: 시작/일시정지 · Esc: 닫기
                  </Text>
                </VStack>
              </Flex>
            )}
            {/* 일시정지 배지 */}
            {running && paused && (
              <Box
                position="absolute"
                top={3}
                left="50%"
                transform="translateX(-50%)"
                bg={`${C.tileLight}E6`}
                border={`2px solid ${INNER_BORDER}`}
                rounded="full"
                px={3}
                py={1}
              >
                <Text fontSize="sm" color={TEXT_INK} fontWeight="bold">PAUSED</Text>
              </Box>
            )}
          </Box>

          {/* 우: 사이드 패널 */}
          <VStack
            align="stretch"
            bg={CARD_BG}
            rounded="md"
            border={`3px solid ${INNER_BORDER}`}
            p={3}
            minW="240px"
            spacing={3}
            // 예산 초과 흔들림
            sx={!reduce && overBudget ? {
              animation: "shake 0.35s ease",
            } : undefined}
          >
            <HStack justify="space-between">
              <Badge colorScheme="purple" rounded="full" px={2}>월급</Badge>
              <Text fontWeight="bold" color={TEXT_INK}>{toKRW(incomeManwon)}</Text>
            </HStack>

            <HStack justify="space-between">
              <Badge colorScheme="purple" rounded="full" px={2}>필수</Badge>
              <Text color={TEXT_INK}>{reqCount}/{CONFIG.REQUIRED_KEYS.length}</Text>
            </HStack>

            {overBudget && <Badge colorScheme="red">예산 초과!</Badge>}

            <Divider borderColor={C.border} opacity={0.3}/>

            <Text fontSize="sm" color={C.border}>남은 예산</Text>
            <Heading size="md" color={TEXT_INK}>{toKRW(incomeManwon - spentManwon)}</Heading>

            <VStack align="stretch" spacing={2} pt={2}>
              <Text fontSize="sm" color={C.border}>행복 지수</Text>
              <Progress value={kpis.happy} colorScheme="purple" rounded="full"/>
              <Text fontSize="sm" color={C.border}>건강 지수</Text>
              <Progress value={kpis.health} colorScheme="purple" rounded="full"/>
              <Text fontSize="sm" color={C.border}>안정성 지수</Text>
              <Progress value={kpis.stability} colorScheme="purple" rounded="full"/>
            </VStack>

            <HStack pt={2} justify="space-between">
              <Button
                variant="outline"
                borderColor={C.border}
                color={C.border}
                _hover={{ bg: C.ribbon }}
                onClick={onClose}
              >
                닫기 (Esc)
              </Button>
              <HStack>
                <Button
                  variant="outline"
                  borderColor={C.border}
                  color={C.border}
                  _hover={{ bg: C.ribbon }}
                  onClick={() => setPaused(p => !p)}
                >
                  {paused ? "재개" : "일시정지"}
                </Button>
                <Button colorScheme="purple" onClick={finish}>종료 & 리포트</Button>
              </HStack>
            </HStack>

            <Text fontSize="xs" color={C.border} opacity={0.7}>
              교육 모드: 고정 시퀀스 / 아케이드: 난수 드롭
            </Text>
          </VStack>
        </Flex>
      </Box>

      {/* 키프레임: 스캔라인(상위 배경), 흔들림(사이드패널) */}
      <style>{`
        @keyframes shine {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes shake {
          0% { transform: translateX(0) }
          25% { transform: translateX(-6px) }
          50% { transform: translateX(4px) }
          75% { transform: translateX(-3px) }
          100% { transform: translateX(0) }
        }
      `}</style>
    </Box>
  );
}
