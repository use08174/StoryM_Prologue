# extract_rows.py
# 사용 예:
# python extract_rows.py \
#   --in assets/sprites/main_girl.png \
#   --out assets/sprites/main_girl_rows9_12.png \
#   --fw 64 --fh 64 --cols 9 --spacing 0 --margin 0 \
#   --start-row 9 --end-row 12

import argparse
from math import floor
from PIL import Image

def parse_args():
    p = argparse.ArgumentParser(description="Spritesheet에서 특정 행만 추출")
    p.add_argument("--in", dest="input_path", required=True, help="원본 시트 경로")
    p.add_argument("--out", dest="output_path", required=True, help="결과 시트 경로")
    p.add_argument("--fw", dest="fw", type=int, required=True, help="frameWidth(픽셀)")
    p.add_argument("--fh", dest="fh", type=int, required=True, help="frameHeight(픽셀)")
    p.add_argument("--cols", dest="cols", type=int, default=None,
                   help="한 행의 프레임 수(모르면 생략, 자동 계산)")
    p.add_argument("--spacing", dest="spacing", type=int, default=0, help="프레임 간 간격(px)")
    p.add_argument("--margin", dest="margin", type=int, default=0, help="좌/상 바깥 여백(px)")
    p.add_argument("--start-row", dest="start_row", type=int, default=9, help="시작 행(1-based)")
    p.add_argument("--end-row", dest="end_row", type=int, default=12, help="끝 행(1-based)")
    return p.parse_args()

def main():
    args = parse_args()
    img = Image.open(args.input_path).convert("RGBA")
    sheet_w, sheet_h = img.size

    fw, fh = args.fw, args.fh
    spacing, margin = args.spacing, args.margin
    start_row, end_row = args.start_row, args.end_row

    if start_row < 1 or end_row < start_row:
        raise ValueError("start-row/end-row 값을 확인하세요. (1-based, start <= end)")

    # cols 자동 계산 (지정 안 했을 때)
    if args.cols is None:
        cols = floor((sheet_w - 2*margin + spacing) / (fw + spacing))
    else:
        cols = args.cols

    if cols <= 0:
        raise ValueError("cols 계산 실패: fw/spacing/margin 또는 이미지 폭을 확인하세요.")

    # 한 행의 실제 픽셀 폭(간격 포함)
    row_width = cols * fw + (cols - 1) * spacing
    row_height = fh

    # 추출할 행 개수
    rows_to_extract = end_row - start_row + 1

    # 출력 이미지 크기(행들을 세로로 쌓기, 간격 유지)
    out_w = row_width
    out_h = rows_to_extract * fh + (rows_to_extract - 1) * spacing

    out = Image.new("RGBA", (out_w, out_h), (0, 0, 0, 0))

    for r in range(start_row, end_row + 1):  # 1-based
        src_y = margin + (r - 1) * (fh + spacing)
        src_x = margin
        box = (src_x, src_y, src_x + row_width, src_y + row_height)

        # 경계 체크
        if box[0] < 0 or box[1] < 0 or box[2] > sheet_w or box[3] > sheet_h:
            raise ValueError(
                f"Row {r} 잘라내기 범위가 시트를 벗어납니다: {box}, sheet={sheet_w}x{sheet_h}"
            )

        row_img = img.crop(box)

        idx = r - start_row  # 0-based
        dst_y = idx * (fh + spacing)
        out.paste(row_img, (0, dst_y))

    out.save(args.output_path)
    print(f"✅ Saved: {args.output_path}  ({out_w}x{out_h})  cols={cols}, spacing={spacing}, margin={margin}")

if __name__ == "__main__":
    main()
