import { useRef, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  onLoadMore?: () => void; // › 버튼이 끝에 도달하면 더 불러오기
};

// 가로로 이어지는 카드들을 ‹ › 버튼으로 넘겨보는 캐러셀
const Carousel = ({ children, onLoadMore }: Props) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: 'smooth' });

    // 오른쪽으로 넘길 때, 거의 끝이면 더 불러오기
    if (dir > 0 && onLoadMore) {
      const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 340;
      if (nearEnd) onLoadMore();
    }
  };

  return (
    <div className="carousel">
      <button className="carousel-btn left" onClick={() => scroll(-1)} aria-label="이전">
        ‹
      </button>
      <div className="carousel-track" ref={trackRef}>
        {children}
      </div>
      <button className="carousel-btn right" onClick={() => scroll(1)} aria-label="다음">
        ›
      </button>
    </div>
  );
};

export default Carousel;
