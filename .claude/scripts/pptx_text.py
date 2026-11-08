# PPTX 강의록에서 슬라이드별 텍스트를 추출한다 (그룹 도형 · 표 · 발표자 노트 포함).
# 사용: python3 -I pptx_text.py <파일.pptx>
import sys

from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE


def walk(shapes):
    for shape in shapes:
        if shape.shape_type == MSO_SHAPE_TYPE.GROUP:
            yield from walk(shape.shapes)
        else:
            yield shape


def main(path: str) -> None:
    prs = Presentation(path)
    for i, slide in enumerate(prs.slides, 1):
        print(f"--- 슬라이드 {i}")
        for shape in walk(slide.shapes):
            if shape.has_text_frame:
                for para in shape.text_frame.paragraphs:
                    text = "".join(run.text for run in para.runs).strip()
                    if text:
                        print(text)
            if getattr(shape, "has_table", False) and shape.has_table:
                for row in shape.table.rows:
                    print(" | ".join(cell.text.strip() for cell in row.cells))
        if slide.has_notes_slide:
            notes = slide.notes_slide.notes_text_frame.text.strip()
            if notes:
                print("[노트]", notes)


if __name__ == "__main__":
    main(sys.argv[1])
