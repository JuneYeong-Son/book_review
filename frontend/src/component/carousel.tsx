import { useRef, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

// 가로로 이어지는 카드들을 ‹ › 버튼으로 넘겨보는 캐러셀
const Carousel = ({ children }: Props) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    trackRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <div className="carousel">
      <button className="carousel-btn left" onClick={() => scroll(-1)} aria-label="이전">‹</button>
      <div className="carousel-track" ref={trackRef}>
        {children}
      </div>
      <button className="carousel-btn right" onClick={() => scroll(1)} aria-label="다음">›</button>
    </div>
  );
};

export default Carousel;
