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
  useToast
} from "@chakra-ui/react";
import { PIXEL_PALETTE as C } from "../pixelpalette";
import Quest1MessageModal from "./MessageModal";
import Quest1Rulebook from "./Quest1Rulebook"; // ✅ 새 컴포넌트

// 카드 안에 들어갈 아이콘 이미지 크기
const DROP_ICON_SIZE = 40;


type Props = {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (report: Report) => void; // ✅ 성공일 때만 호출(실패는 재도전 오버레이)
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

// ------------ 테마 ------------
const FRAME_BG = `${C.tileLight}`;
const FRAME_BORDER = `${C.border}`;
const INNER_BORDER = `${C.border}`;
const CARD_BG = `${C.ribbon}`;
const TEXT_INK = `${C.ink}`;
const LABEL_BG = `${C.ribbon}`;
const LABEL_TEXT = `${C.ink}`;
const GLASS_BG = `${C.tileLight}F2`;

// ------------ 게임/룰 설정 (여기서 수치만 수정해도 됨) ------------
const CONFIG = {
  INCOME_MANWON: 180,           // 만원
  DURATION_SEC: 75,
  BASE_DROP_EVERY_MS: 900,
  ARCADE_MIN_MS: 450,
  CART_SPEED: 8,
  DROP_W: 68,
  DROP_H: 56,
  DROP_RADIUS: 12,
  EMOJI_FONT: 30,
  PRICE_PILL_W: 46,
  PRICE_PILL_H: 20,
  PRICE_FONT: 14,
  DROP_BORDER: 3,
  PRICE_PILL_BORDER: 2,

  REQUIRED_KEYS: ["home", "food", "net"],

  // KPI 합격선(실패 기준)
  THRESH: {
    stabilityMin: 40,   // ✅ 안정성 미만이면 실패
    healthMin: 25,      // 선택: 건강도 너무 낮으면 실패
  },

  // 성공 판정은 "필수항목 충족 && KPI 합격선 이상"으로 처리
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

// 오버레이 상태
type OverlayKind = "intro" | "fail" | null;

// ============= 컴포넌트 =============
export default function Quest1({
  isOpen,
  onClose,
  onFinish,
  mode="edu",
  incomeKRW = 1_800_000,
}: Props) {
  const reduce = usePrefersReducedMotion();
  const toast = useToast();
  const showCenterToast = (
  title: string,
  body: string,
  status: "success" | "error" | "info" | "warning" = "success"
) =>
  toast({
    duration: status === "success" ? 2000 : 2000, // 🔸 좀 더 빨리 사라지게
    isClosable: false,
    render: () => {
      const variants = {
        success: {
          emoji: "✅",
          label: "MISSION CLEAR",
          ring: "#4ade80",
          bg: "linear-gradient(135deg, rgba(34,197,94,0.98), rgba(22,163,74,0.95))",
        },
        error: {
          emoji: "❌",
          label: "MISSION FAILED",
          ring: "#fb7185",
          bg: "linear-gradient(135deg, rgba(248,113,113,0.98), rgba(220,38,38,0.95))",
        },
        info: {
          emoji: "💡",
          label: "NOTICE",
          ring: "#38bdf8",
          bg: "linear-gradient(135deg, rgba(56,189,248,0.98), rgba(37,99,235,0.95))",
        },
        warning: {
          emoji: "⚠️",
          label: "CAUTION",
          ring: "#facc15",
          bg: "linear-gradient(135deg, rgba(250,204,21,0.98), rgba(217,119,6,0.95))",
        },
      } as const;

      const v = variants[status] ?? variants.info;

      return (
        <Box
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={2000}
          pointerEvents="none"
        >
          <Box
            pointerEvents="auto"
            px={5}
            py={4}
            minW="320px"
            maxW="420px"
            bg={v.bg}
            borderRadius="20px"
            border={`3px solid ${v.ring}`}
            boxShadow={`0 16px 40px rgba(15,23,42,0.55)`}
            color="white"
            fontFamily="'NeoDGM', system-ui, sans-serif"
            position="relative"
            overflow="hidden"
            animation="toast-pop 0.26s ease-out"
          >
            {/* 테두리 안쪽 라인 */}
            <Box
              position="absolute"
              inset="4px"
              borderRadius="14px"
              border="1px solid rgba(15,23,42,0.45)"
              opacity={0.7}
              pointerEvents="none"
            />

            <HStack spacing={3} align="flex-start" position="relative" zIndex={1}>
              <Box
                w="40px"
                h="40px"
                borderRadius="full"
                bg="rgba(15,23,42,0.35)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="2xl"
              >
                {v.emoji}
              </Box>
              <VStack align="flex-start" spacing={1} flex="1">
                <Text
                  fontSize="10px"
                  textTransform="uppercase"
                  letterSpacing="0.18em"
                  opacity={0.85}
                >
                  {v.label}
                </Text>
                <Text fontWeight="bold" fontSize="lg">
                  {title}
                </Text>
                <Text
                  fontSize="sm"
                  opacity={0.9}
                  whiteSpace="pre-wrap"
                  lineHeight="1.4"
                >
                  {body}
                </Text>
              </VStack>
            </HStack>
          </Box>
        </Box>
      );
    },
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [overlay, setOverlay] = useState<OverlayKind>("intro");
  const [failReason, setFailReason] = useState<string>("");

  // UI state
  const [incomeManwon] = useState(Math.round(incomeKRW/10000));
  const [spentManwon, setSpentManwon] = useState(0);
  const [bag, setBag] = useState<Bag>({});
  const [reqCount, setReqCount] = useState(0);
  const [overBudget, setOverBudget] = useState(false);

  const kpis = useMemo<KPIs>(() => computeKPIs(bag), [bag]);

  // 내부 게임 상태
  const stateRef = useRef({
    width: 900, height: 520,
    cart: { x: 900/2, y: 520-32, w: 132, h: 24 }, // 카트도 약간 키움
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
    st.cart = { x: st.width/2, y: st.height-32, w: 132, h: 24 };
    setSpentManwon(0);
    setBag({});
    setReqCount(0);
    setOverBudget(false);
    setRunning(false);
    setPaused(false);
    setOverlay("intro");
    setFailReason("");
    lastTimeRef.current = null;
    resizeCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode]);

  // 반응형/고DPI 캔버스
  const resizeCanvas = () => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ratio = (window.devicePixelRatio || 1);
    const st = stateRef.current;
    cvs.width = Math.floor(st.width * ratio);
    cvs.height = Math.floor(st.height * ratio);
    const ctx = cvs.getContext("2d");
    if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  // 초기화
useEffect(() => {
  if (!isOpen) return;
  const st = stateRef.current;
  st.pool = mode === "edu" ? buildFixed() : [];
  st.timer = 0; st.nextDrop = 0; st.drops = [];
  st.keys.clear();
  st.cart = { x: st.width/2, y: st.height-32, w: 132, h: 24 };
  setSpentManwon(0);
  setBag({});
  setReqCount(0);
  setOverBudget(false);
  setRunning(false);
  setPaused(false);
  setOverlay("intro");
  setFailReason("");
  lastTimeRef.current = null;
  resizeCanvas();
  // 🔥 추가 끝
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isOpen, mode]);


  // 입력
  useEffect(() => {
    if (!isOpen) return;
    const st = stateRef.current;
    const cvs = canvasRef.current!;
    const keyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft","ArrowRight"].includes(e.key)) st.keys.add(e.key);
      if (e.key === " ") {
        e.preventDefault();
        // ▶ 게임 시작 전(인트로)에는 가이드 모달 먼저
        if (overlay === "intro" && !running) {
          setShowGuide(true);
          return;
        }
        // ▶ 진행 중이면 일시정지 토글
        if (running) setPaused(p => !p);
      }
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
    setOverlay(null);
    setRunning(true);
    setPaused(false);
    setFailReason("");
    lastTimeRef.current = null;
  };

  const evaluate = (bagCandidate: Bag) => {
    const requiredOk = CONFIG.REQUIRED_KEYS.every(k => (bagCandidate[k]||0) > 0);
    const k = computeKPIs(bagCandidate);
    const ok =
      requiredOk &&
      k.stability >= CONFIG.THRESH.stabilityMin &&
      k.health    >= CONFIG.THRESH.healthMin;
    const reasons: string[] = [];
    if (!requiredOk) reasons.push("필수 항목(주거·식비·통신) 부족");
    if (k.stability < CONFIG.THRESH.stabilityMin) reasons.push(`안정성 지수 미달(${k.stability} < ${CONFIG.THRESH.stabilityMin})`);
    if (k.health    < CONFIG.THRESH.healthMin)    reasons.push(`건강 지수 미달(${k.health} < ${CONFIG.THRESH.healthMin})`);
    return { ok, requiredOk, k, reasons };
  };

  const finishSuccess = (bagFinal: Bag, spentFinal: number) => {
    setRunning(false);
    const remain = incomeManwon - spentFinal;
    const evalRes = evaluate(bagFinal);
    showCenterToast(
      "MISSION 1 COMPLETE!",
      `성공하셨습니다!\n남은 예산 ${toKRW(remain)}\n\n다음 미션을 위해 지하철 역 밖으로 나가세요.`,
      "success"
    );

    onFinish({
      remainKRW: remain * 100,
      requiredOk: evalRes.requiredOk,
      kpis: evalRes.k,
      bag: bagFinal,
    });
  };

  const finishFailAndExit = (reasons: string[]) => {
    setRunning(false);
    showCenterToast(
      "MISSION 1 FAILED",
      (reasons.join(" / ") || "기준 미달입니다. 다시 도전해보세요!"),
      "error"
    );
    onClose();
  };

  const finishFail = (reasons: string[]) => {
    setRunning(false);
    setFailReason(reasons.join("\n"));
    setOverlay("fail");
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
      if (hit) { addItemImmediate(d.key); return false; }
      return d.y < st.height + 60;
    });

    // 종료 조건(교육): 시간 끝나면 평가
    if (mode === "edu") {
      const sec = st.timer/1000;
      if (sec >= CONFIG.DURATION_SEC || (st.pool.length===0 && st.drops.length===0)) {
        // 최종 평가
        const { ok, reasons } = evaluate(stateBagRef.current);
        if (ok) finishSuccess(stateBagRef.current, spentManwonRef.current);
        else    finishFail(reasons);
      }
    }
  };

  // ✅ 최신 bag/spent를 즉시 평가에 쓰기 위한 ref
  const spentManwonRef = useRef(spentManwon);
  const stateBagRef = useRef<Bag>(bag);
  useEffect(()=>{ spentManwonRef.current = spentManwon; },[spentManwon]);
  useEffect(()=>{ stateBagRef.current = bag; },[bag]);

  // ✅ 아이템 즉시 적용 + 예산 0 되면 즉시 종료/평가
  const addItemImmediate = (key:string) => {
    const it = CONFIG.ITEMS.find(i => i.key === key)!;
    const nextSpent = spentManwonRef.current + it.price;
    if (nextSpent > incomeManwon) {
      setOverBudget(true);
      setTimeout(()=> setOverBudget(false), 600);
      return;
    }

    const bagCandidate: Bag = { ...stateBagRef.current, [key]: (stateBagRef.current[key]||0) + it.price };
    const reqGot = CONFIG.REQUIRED_KEYS.filter(k => (bagCandidate[k]||0)>0).length;

    setSpentManwon(nextSpent);
    setBag(bagCandidate);
    setReqCount(reqGot);

    // ✅ 남은 예산 0 → 즉시 평가 & 메인 복귀
    if (nextSpent === incomeManwon) {
      const { ok, reasons } = evaluate(bagCandidate);
      if (ok) finishSuccess(bagCandidate, nextSpent);
      else    finishFailAndExit(reasons);
    }
  };


  const spawn = (st: typeof stateRef.current): Drop => {
    const pickKey = () => {
      if (mode === "edu") return st.pool.shift()!;
      const idx = Math.floor(st.rng()*CONFIG.ITEMS.length);
      return CONFIG.ITEMS[idx].key;
    };
    const key = pickKey();
    const it = CONFIG.ITEMS.find(i=>i.key===key)!;
    const x = Math.floor(st.rng()*(st.width-80))+40;
    const vy = mode==='arcade' ? 2.6 + (st.rng()*2.6) : 2.3;
    return { key: it.key, emoji: it.emoji, color: it.color, price: it.price, x, y:-30, vy, r: 22 }; // ✅ r 키움
  };

  const collide = (cart:{x:number;y:number;w:number;h:number}, d:Drop) => {
    const withinX = Math.abs(d.x - cart.x) < (cart.w/2);
    const withinY = (cart.y - d.y) < d.r + 10 && Math.abs(d.y - cart.y) < 30;
    return withinX && withinY;
  };

  // ======= KPI 계산 헬퍼 =======
  function computeKPIs(b: Bag): KPIs {
    return {
      happy: CONFIG.SCORE.happy(b),
      health: CONFIG.SCORE.health(b),
      stability: CONFIG.SCORE.stability(b),
    };
  }

  // ======= 렌더링 =======
  const draw = () => {
    const st = stateRef.current;
    const cvs = canvasRef.current!;
    const ctx = cvs.getContext("2d")!;
    ctx.clearRect(0,0,st.width,st.height);

    // 배경
    const grad = ctx.createLinearGradient(0,0,0,st.height);
    grad.addColorStop(0, C.tileLight);
    grad.addColorStop(1, C.tileMid);
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,st.width,st.height);

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
    ctx.arc(x, y-h/2, 20, Math.PI, 0);
    ctx.stroke();
  };

  // drawDrop 내부
  const drawDrop = (ctx: CanvasRenderingContext2D, d: Drop) => {
  const ICON_SIZE = DROP_ICON_SIZE;

  // 아이콘(이모지) 기준 Y 위치
  const iconY = d.y - 6;

  // 🔥 이모지만 그리기
  ctx.font = `${CONFIG.EMOJI_FONT}px system-ui, Apple Color Emoji, Segoe UI Emoji`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = TEXT_INK;
  ctx.fillText(d.emoji, d.x, iconY);

  // ========================
  //  가격 pill (아이콘 아래)
  // ========================
  const pillW = CONFIG.PRICE_PILL_W;
  const pillH = CONFIG.PRICE_PILL_H;
  const pillX = d.x - pillW / 2;
  const pillY = iconY + ICON_SIZE / 2 + 4; // 아이콘 바로 아래에 위치

  ctx.save();
  ctx.lineWidth = CONFIG.PRICE_PILL_BORDER;
  roundRect(
    ctx,
    pillX,
    pillY,
    pillW,
    pillH,
    pillH / 2,                 // pill 모양
    true,
    true,
    `${C.tileLight}F2`,
    C.border
  );
  ctx.restore();

  ctx.save();
  ctx.fillStyle = C.border;
  ctx.font = `bold ${CONFIG.PRICE_FONT}px system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${d.price}만`, d.x, pillY + pillH / 2);
  ctx.restore();
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

  const remainManwon = incomeManwon - spentManwon;

  return (
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
      <Quest1MessageModal
        isOpen={showGuide}
        title="버디"
        avatarSrc="/assets/avatars/buddy.png"
        messages={[
          "첫 월 예산 안에서 필수 항목(🏠 주거, 🥦 식비, 📶 통신)을 빠짐없이 담아봐!",
          "남은 예산이 0원이 되면 즉시 평가할게. 안정성/건강 기준도 충족해야 성공!",
          "←/→ 로 카트를 움직여 과일(예산 항목)을 받아 담으면 돼."
        ]}
        onComplete={() => {
          setShowGuide(false);
          start(); // ▶ 여기서 실제 게임 시작
        }}
        onClose={() => setShowGuide(false)}
      />
            <Box
        // ✅ 카드 프레임 대신 전체 화면을 쓰는 레이아웃 박스
        position="absolute"
        inset={0}
        pt={`max(64px, calc(env(safe-area-inset-top) + 32px))`}
        pb={`max(16px, env(safe-area-inset-bottom))`}
        px={[4, 8, 10]}
      >
        {/* 상단 라벨 (그대로 화면 왼쪽 위에 붙여두기) */}
        <Box
          position="absolute"
          top={`max(10px, env(safe-area-inset-top))`}
          left="18px"
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

        <Flex
          gap={[3, 4, 6]}
          align="stretch"
          h="100%"
          direction={["column-reverse", "row"]} // 모바일에서는 패널이 아래로
        >
          {/* 좌: 캔버스 영역 */}
          <Box
            position="relative"
            ref={containerRef}
            flex="1 1 0"
            minW={0}
            rounded="lg"
            border={`2px solid ${INNER_BORDER}`}
            p={[2, 3]}
            bg={`${CARD_BG}D0`}
            backdropFilter="blur(4px)"
          >
            <canvas
              ref={canvasRef}
              width={900}
              height={520}
              style={{
                width: "100%",     // ✅ 가로는 가능한 만큼 채우기
                height: "auto",    // ✅ 비율 유지하면서 세로 자동
                display: "block",
                borderRadius: 8
              }}
            />

            {/* ✅ 오버레이(인트로/실패)는 그대로 유지 */}
            {overlay && (
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
                  maxW="560px"
                  textAlign="center"
                  spacing={3}
                >
                  {/* intro / fail 내용 그대로 */}
                  {overlay === "intro" && (
                    <>
                      <Heading size="md" color={TEXT_INK} fontFamily="'NeoDGM', system-ui, sans-serif">
                        퀘스트 1 : 한 달 예산 꾸리기
                      </Heading>
                      <HStack pt={1}>
                        <Button colorScheme="purple" onClick={() => setShowGuide(true)} fontFamily="'NeoDGM', system-ui, sans-serif">
                          시작하기 (Space)
                        </Button>
                        <Quest1Rulebook
                          stabilityMin={CONFIG.THRESH.stabilityMin}
                          healthMin={CONFIG.THRESH.healthMin}
                          autoOpen={overlay === "intro"}   // 🔥 인트로일 때 자동으로 오픈
                        />
                      </HStack>
                      <Text fontSize="xs" opacity={0.7} color={C.border} fontFamily="'NeoDGM', system-ui, sans-serif">
                        Space: 시작/일시정지 · Esc: 닫기
                      </Text>
                    </>
                  )}

                  {overlay === "fail" && (
                    <>
                      <Heading size="md" color={TEXT_INK} fontFamily="'NeoDGM', system-ui, sans-serif">아쉽지만 실패!</Heading>
                      <Text color={C.border} whiteSpace="pre-wrap" fontFamily="'NeoDGM', system-ui, sans-serif">
                        {failReason || "기준을 충족하지 못했어요."}
                      </Text>
                      <HStack>
                        <Button
                          colorScheme="purple"
                          onClick={() => {
                            const st = stateRef.current;
                            st.pool = mode === "edu" ? buildFixed() : [];
                            st.timer = 0; st.nextDrop = 0; st.drops = [];
                            st.keys.clear();
                            st.cart = { x: st.width/2, y: st.height-32, w: 132, h: 24 };
                            setSpentManwon(0);
                            setBag({});
                            setReqCount(0);
                            setOverBudget(false);
                            setFailReason("");
                            setOverlay(null);
                            setRunning(true);
                            setPaused(false);
                            lastTimeRef.current = null;
                          }}
                        >
                          다시하기
                        </Button>
                        <Button
                          variant="outline"
                          onClick={onClose}
                          borderColor={C.border}
                          color={C.border}
                          _hover={{ bg: C.ribbon }}
                        >
                          닫기
                        </Button>
                      </HStack>
                    </>
                  )}
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

          {/* 우: 사이드 패널 (오른쪽 고정 HUD 느낌) */}
          <VStack
            align="stretch"
            bg={GLASS_BG} // ✅ 반투명 유리 느낌으로, 배경 사진 살리기
            rounded="lg"
            border={`2px solid ${INNER_BORDER}`}
            p={3}
            minW={["100%", "260px"]}
            maxW={["100%", "320px"]}
            spacing={3}
            sx={!reduce && overBudget ? { animation: "shake 0.35s ease" } : undefined}
          >
            {/* 아래 내용은 기존 그대로 */}
            <HStack justify="space-between">
              <Badge colorScheme="purple" rounded="full" px={2} fontFamily="'NeoDGM', system-ui, sans-serif">월급</Badge>
              <Text fontWeight="bold" color={TEXT_INK}>{toKRW(incomeManwon)}</Text>
            </HStack>

            <HStack justify="space-between">
              <Badge colorScheme="purple" rounded="full" px={2} fontFamily="'NeoDGM', system-ui, sans-serif">필수</Badge>
              <Text color={TEXT_INK}>{reqCount}/{CONFIG.REQUIRED_KEYS.length}</Text>
            </HStack>

            {overBudget && <Badge colorScheme="red" fontFamily="'NeoDGM', system-ui, sans-serif">예산 초과!</Badge>}

            <Divider borderColor={C.border} opacity={0.3}/>

            <Text fontSize="sm" color={C.border} fontFamily="'NeoDGM', system-ui, sans-serif">남은 예산</Text>
            <Heading size="md" color={TEXT_INK} fontFamily="'NeoDGM', system-ui, sans-serif">{toKRW(remainManwon)}</Heading>
            <VStack align="stretch" spacing={2} pt={2}>
              <Text fontSize="sm" color={C.border} fontFamily="'NeoDGM', system-ui, sans-serif">행복 지수</Text>
              <Progress value={kpis.happy} colorScheme="purple" rounded="full"/>
              <Text fontSize="sm" color={C.border} fontFamily="'NeoDGM', system-ui, sans-serif">건강 지수</Text>
              <Progress value={kpis.health} colorScheme="purple" rounded="full"/>
              <Text fontSize="sm" color={C.border} fontFamily="'NeoDGM', system-ui, sans-serif">안정성 지수</Text>
              <Progress value={kpis.stability} colorScheme="purple" rounded="full"/>
            </VStack>

            <HStack pt={5} justify="space-between">
              <Button
                variant="outline"
                borderColor={C.border}
                color={C.border}
                _hover={{ bg: C.ribbon }}
                onClick={onClose}
                fontFamily="'NeoDGM', system-ui, sans-serif"
              > 
                닫기
              </Button>
              <HStack>
                <Button
                  variant="outline"
                  borderColor={C.border}
                  color={C.border}
                  _hover={{ bg: C.ribbon }}
                  onClick={() => setPaused(p => !p)}
                  isDisabled={!running}
                  fontFamily="'NeoDGM', system-ui, sans-serif"
                > 
                  {paused ? "재개" : "일시정지"}
                </Button>
                <Button
                  colorScheme="purple"
                  onClick={() => {
                    const { ok, reasons } = evaluate(stateBagRef.current);
                    if (ok) finishSuccess(stateBagRef.current, spentManwonRef.current);
                    else    finishFailAndExit(reasons);
                  }}
                  fontFamily="'NeoDGM', system-ui, sans-serif"
                >
                  종료
                </Button>
              </HStack>
            </HStack>
          </VStack>
        </Flex>
      </Box>


      <style>{`
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
