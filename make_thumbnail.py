#!/usr/bin/env python3
"""
모두의 판타지 - 앱인토스 가로형 썸네일 생성기
실행: python3 make_thumbnail.py
출력: thumbnail_1932x828.png
"""

from PIL import Image, ImageDraw, ImageFont
import math
import os
import sys

# ── 폰트 경로 설정 (macOS 기본 한글 폰트) ─────────────────────
FONT_CANDIDATES = [
    # macOS
    "/System/Library/Fonts/AppleSDGothicNeo.ttc",
    "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
    "/Library/Fonts/NanumGothicBold.ttf",
    "/Library/Fonts/NanumGothic.ttf",
    # Linux (있을 경우)
    "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc",
]

def find_font():
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            return path
    return None

FONT_PATH = find_font()
if not FONT_PATH:
    print("❌ 한글 폰트를 찾을 수 없어요.")
    print("   아래 중 하나를 설치해주세요:")
    print("   - 나눔고딕: https://hangeul.naver.com/font")
    sys.exit(1)

print(f"✅ 폰트 사용: {FONT_PATH}")

# ── 캔버스 설정 ────────────────────────────────────────────────
W, H = 1932, 828
img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# ── 헬퍼: 라디알 그라디언트 ──────────────────────────────────
def radial_gradient(cx, cy, r, color_inner, color_outer, strength=1.0):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pixels = layer.load()
    ri, gi, bi, ai = color_inner
    ro, go, bo, ao = color_outer
    for y in range(H):
        for x in range(W):
            dist = math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
            t = min(dist / r, 1.0) ** strength
            pr = int(ri + (ro - ri) * t)
            pg = int(gi + (go - gi) * t)
            pb = int(bi + (bo - bi) * t)
            pa = int(ai + (ao - ai) * t)
            pixels[x, y] = (
                max(0, min(255, pr)),
                max(0, min(255, pg)),
                max(0, min(255, pb)),
                max(0, min(255, pa)),
            )
    return layer

# ── 1. 배경 그라디언트 ─────────────────────────────────────────
bg = Image.new("RGB", (W, H))
bg_draw = ImageDraw.Draw(bg)
for y in range(H):
    t = y / H
    # #0A0A1E → #120D35
    r = int(10 + 8 * t)
    g = int(10 + 3 * t)
    b = int(30 + 23 * t)
    bg_draw.line([(0, y), (W, y)], fill=(r, g, b))

# 좌→우 추가 색상 그라디언트
for x in range(W):
    t = x / W
    alpha = int(30 * (1 - t))
    for y in range(H):
        r0, g0, b0 = bg.getpixel((x, y))
        bg.putpixel((x, y), (
            min(255, r0 + int(15 * (1 - t))),
            min(255, g0),
            min(255, b0 + int(10 * t)),
        ))

img = bg.convert("RGBA")
draw = ImageDraw.Draw(img)

# ── 2. 보라색 글로우 배경 원들 ─────────────────────────────────
def add_glow(cx, cy, radius, color_rgba, strength=0.4):
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    r, g, b, a = color_rgba
    steps = 25
    for i in range(steps, 0, -1):
        t = i / steps
        curr_r = int(radius * t)
        alpha = int(a * (1 - t) ** 0.5 * strength)
        gd.ellipse(
            [cx - curr_r, cy - curr_r, cx + curr_r, cy + curr_r],
            fill=(r, g, b, alpha),
        )
    img.alpha_composite(glow)

add_glow(-80, -100, 700, (120, 30, 220, 200), 0.35)
add_glow(W // 2, H + 100, 600, (80, 10, 180, 180), 0.25)
add_glow(W - 200, 100, 450, (160, 80, 255, 160), 0.20)

# ── 3. 별 장식 ─────────────────────────────────────────────────
import random
random.seed(42)
star_positions = [
    (0.08, 0.12, 2.5), (0.22, 0.08, 1.5), (0.38, 0.18, 3.0),
    (0.55, 0.06, 2.0), (0.70, 0.22, 2.5), (0.85, 0.10, 1.8),
    (0.92, 0.35, 2.0), (0.15, 0.65, 1.5), (0.30, 0.80, 2.0),
    (0.45, 0.88, 1.8), (0.60, 0.75, 2.5), (0.75, 0.85, 1.5),
    (0.10, 0.45, 1.8), (0.48, 0.50, 1.2), (0.80, 0.55, 2.2),
]
for sx, sy, sr in star_positions:
    x, y = int(sx * W), int(sy * H)
    alpha = random.randint(100, 200)
    r = int(sr)
    draw.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, alpha))

# ── 4. 세로 구분선 ────────────────────────────────────────────
divider_x = int(W * 0.63)
for y in range(H):
    t = y / H
    if t < 0.1:
        alpha = int(255 * (t / 0.1) * 0.20)
    elif t > 0.9:
        alpha = int(255 * ((1 - t) / 0.1) * 0.20)
    else:
        alpha = int(255 * 0.20)
    draw.point([divider_x, y], fill=(150, 80, 255, alpha))

# ── 5. 왼쪽 텍스트 영역 ─────────────────────────────────────────
LEFT_X = 100
try:
    font_badge = ImageFont.truetype(FONT_PATH, 28, index=0)
    font_title_lg = ImageFont.truetype(FONT_PATH, 120, index=0)
    font_subtitle = ImageFont.truetype(FONT_PATH, 38, index=0)
    font_body = ImageFont.truetype(FONT_PATH, 30, index=0)
    font_tag = ImageFont.truetype(FONT_PATH, 26, index=0)
except Exception as e:
    print(f"폰트 로드 오류: {e}")
    sys.exit(1)

# 배지 텍스트
BADGE_TEXT = "✦  AI 웹소설 창작 도우미"
badge_bb = draw.textbbox((0, 0), BADGE_TEXT, font=font_badge)
bw = badge_bb[2] - badge_bb[0] + 40
bh = badge_bb[3] - badge_bb[1] + 20
badge_x, badge_y = LEFT_X, 150
badge_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
badge_draw = ImageDraw.Draw(badge_layer)
badge_draw.rounded_rectangle(
    [badge_x, badge_y, badge_x + bw, badge_y + bh],
    radius=bh // 2,
    fill=(120, 40, 200, 70),
    outline=(180, 100, 255, 120),
    width=1,
)
img.alpha_composite(badge_layer)
draw = ImageDraw.Draw(img)
draw.text((badge_x + 20, badge_y + 10), BADGE_TEXT, font=font_badge, fill=(200, 150, 255, 230))

# 앱 타이틀 (두 줄)
title_y = badge_y + bh + 24
def draw_gradient_text(draw_obj, text, font, x, y, colors):
    """간단한 그라디언트 텍스트 (레이어 합성으로)"""
    # 단색으로 그냥 그리기 (진짜 그라디언트는 복잡하므로 흰색+보라 두 번)
    draw_obj.text((x + 2, y + 2), text, font=font, fill=(150, 80, 255, 80))
    draw_obj.text((x, y), text, font=font, fill=(240, 220, 255, 255))

draw_gradient_text(draw, "모두의", font_title_lg, LEFT_X, title_y)
draw_gradient_text(draw, "판타지", font_title_lg, LEFT_X, title_y + 118)

# 서브타이틀
sub_y = title_y + 118 + 118 + 12
draw.text((LEFT_X, sub_y), "나만의 이야기를, AI와 함께", font=font_subtitle, fill=(180, 140, 255, 200))

# 설명 텍스트
body_y = sub_y + 56
draw.text((LEFT_X, body_y),      "캐릭터를 만들고, 세계관을 설정하고", font=font_body, fill=(200, 200, 220, 140))
draw.text((LEFT_X, body_y + 42), "AI가 도와주는 몰입형 집필 경험", font=font_body, fill=(200, 200, 220, 140))

# ── 6. 기능 태그들 (하단) ────────────────────────────────────
TAGS = ["📖 회차 집필", "🎭 캐릭터 설정", "🌍 세계관 빌더", "🤖 AI 집필 보조"]
tag_y = H - 110
tag_x = LEFT_X
for tag in TAGS:
    tag_bb = draw.textbbox((0, 0), tag, font=font_tag)
    tw = tag_bb[2] - tag_bb[0] + 36
    th = tag_bb[3] - tag_bb[1] + 20

    tag_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    tag_draw = ImageDraw.Draw(tag_layer)
    tag_draw.rounded_rectangle(
        [tag_x, tag_y, tag_x + tw, tag_y + th],
        radius=th // 2,
        fill=(100, 40, 180, 60),
        outline=(160, 90, 255, 100),
        width=1,
    )
    img.alpha_composite(tag_layer)
    draw = ImageDraw.Draw(img)
    draw.text((tag_x + 18, tag_y + 10), tag, font=font_tag, fill=(200, 160, 255, 210))
    tag_x += tw + 16

# ── 7. 오른쪽 오브(마법 구) ──────────────────────────────────
ORB_CX = divider_x + (W - divider_x) // 2 + 20
ORB_CY = H // 2 - 10

def draw_orb_ring(cx, cy, r, color_rgba, line_alpha=60):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    cr, cg, cb, ca = color_rgba
    # 바깥에서 안으로 여러 겹 그리기
    for step in range(r, r - 30, -2):
        t = (r - step) / 30
        a = int(ca * t * 0.6)
        ld.ellipse([cx - step, cy - step, cx + step, cy + step],
                   outline=(cr, cg, cb, a), width=2)
    # 실제 테두리
    ld.ellipse([cx - r, cy - r, cx + r, cy + r],
               outline=(cr, cg, cb, line_alpha), width=2)
    img.alpha_composite(layer)

# 오브 글로우
add_glow(ORB_CX, ORB_CY, 360, (140, 50, 240, 255), 0.45)
add_glow(ORB_CX, ORB_CY, 240, (160, 80, 255, 255), 0.55)
add_glow(ORB_CX, ORB_CY, 160, (200, 120, 255, 255), 0.60)

draw = ImageDraw.Draw(img)
# 오브 테두리 링들
draw_orb_ring(ORB_CX, ORB_CY, 240, (180, 100, 255, 255), 80)
draw_orb_ring(ORB_CX, ORB_CY, 175, (200, 120, 255, 255), 100)
draw_orb_ring(ORB_CX, ORB_CY, 120, (220, 160, 255, 255), 120)

# 오브 내부 하이라이트 (왼쪽 위)
hl_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
hl_draw = ImageDraw.Draw(hl_layer)
hl_x = ORB_CX - 55
hl_y = ORB_CY - 65
hl_draw.ellipse([hl_x, hl_y, hl_x + 80, hl_y + 60], fill=(255, 220, 255, 50))
img.alpha_composite(hl_layer)
draw = ImageDraw.Draw(img)

# 책 아이콘 (오브 중앙)
BK_CX, BK_CY = ORB_CX, ORB_CY
BK_W, BK_H = 110, 90

# 책 왼쪽 페이지
draw.polygon([
    (BK_CX - 55, BK_CY - 40),
    (BK_CX, BK_CY - 38),
    (BK_CX, BK_CY + 42),
    (BK_CX - 55, BK_CY + 40),
], fill=(255, 255, 255, 25), outline=(255, 255, 255, 100))

# 책 오른쪽 페이지
draw.polygon([
    (BK_CX, BK_CY - 38),
    (BK_CX + 55, BK_CY - 40),
    (BK_CX + 55, BK_CY + 40),
    (BK_CX, BK_CY + 42),
], fill=(255, 255, 255, 15), outline=(255, 255, 255, 70))

# 책 중앙 바인딩
draw.line([(BK_CX, BK_CY - 40), (BK_CX, BK_CY + 44)], fill=(255, 255, 255, 180), width=3)

# 왼쪽 줄 장식
for i, ratio in enumerate([0.3, 0.55, 0.75]):
    lx1 = BK_CX - 48
    lx2 = BK_CX - 8
    ly = int(BK_CY - 30 + 70 * ratio)
    draw.line([(lx1, ly), (lx2, ly)], fill=(255, 255, 255, 55), width=2)

# 오른쪽 줄 장식
for i, ratio in enumerate([0.3, 0.55, 0.75]):
    lx1 = BK_CX + 8
    lx2 = BK_CX + 48
    ly = int(BK_CY - 30 + 70 * ratio)
    draw.line([(lx1, ly), (lx2, ly)], fill=(255, 255, 255, 40), width=2)

# 별 장식 (책 위)
draw.text((BK_CX - 8, BK_CY - 60), "✦", font=font_badge, fill=(255, 220, 100, 200))

# 떠다니는 텍스트 조각들 (오브 주변)
float_font = ImageFont.truetype(FONT_PATH, 22, index=0)
floats = [
    ("마법사는 마침내...", ORB_CX - 200, ORB_CY - 195, -8),
    ("그의 눈이 빛났다", ORB_CX + 80, ORB_CY - 160, 5),
    ("어둠 속에서 빛이", ORB_CX - 180, ORB_CY + 160, 6),
    ("두 사람의 운명...", ORB_CX + 70, ORB_CY + 185, -4),
]
for text, fx, fy, angle in floats:
    # 텍스트를 작은 이미지로 렌더링 후 회전
    tw_bb = draw.textbbox((0, 0), text, font=float_font)
    tw = tw_bb[2] - tw_bb[0] + 10
    th = tw_bb[3] - tw_bb[1] + 10
    txt_img = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    txt_draw = ImageDraw.Draw(txt_img)
    txt_draw.text((5, 5), text, font=float_font, fill=(200, 150, 255, 120))
    txt_rotated = txt_img.rotate(angle, expand=True, resample=Image.BICUBIC)
    paste_x = fx - txt_rotated.width // 2
    paste_y = fy - txt_rotated.height // 2
    img.alpha_composite(txt_rotated, dest=(max(0, paste_x), max(0, paste_y)))

# ── 8. 마무리 및 저장 ─────────────────────────────────────────
out_path = os.path.join(os.path.dirname(__file__), "thumbnail_1932x828.png")
final = img.convert("RGB")
final.save(out_path, "PNG", quality=95)
print(f"✅ 썸네일 저장 완료: {out_path}")
print(f"   크기: {final.size[0]}×{final.size[1]}px")
