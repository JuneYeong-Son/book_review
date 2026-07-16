// 별점 — 명시적 변형(explicit variants).
// 입력용/표시용을 하나의 boolean(onChange 유무)으로 분기하지 않고 별도 컴포넌트로 나눈다.

type DisplayProps = {
  value: number;
  size?: number;
};

// 읽기 전용 표시: 상호작용 요소가 아니므로 버튼이 아니라 하나의 이미지(role="img")로 읽힌다.
export const StarRatingDisplay = ({ value, size = 22 }: DisplayProps) => (
  <span
    className="star-rating"
    style={{ fontSize: size }}
    role="img"
    aria-label={`5점 만점에 ${value}점`}
  >
    {[1, 2, 3, 4, 5].map((star) => (
      <span key={star} className={`star readonly ${star <= value ? 'filled' : ''}`} aria-hidden="true">
        ★
      </span>
    ))}
  </span>
);

type InputProps = {
  value: number;
  onChange: (value: number) => void;
  size?: number;
};

// 입력용: 별마다 버튼. 같은 별을 다시 누르면 0점(해제).
export const StarRatingInput = ({ value, onChange, size = 22 }: InputProps) => (
  <span className="star-rating" style={{ fontSize: size }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        className={`star ${star <= value ? 'filled' : ''}`}
        onClick={() => onChange(star === value ? 0 : star)}
        aria-label={`${star}점`}
      >
        ★
      </button>
    ))}
  </span>
);
