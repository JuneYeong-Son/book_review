// 별점 컴포넌트. onChange가 있으면 클릭으로 별점 입력, 없으면 읽기 전용 표시.
type Props = {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
};

const StarRating = ({ value, onChange, size = 22 }: Props) => {
  const readOnly = !onChange;
  return (
    <span className="star-rating" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star ${star <= value ? 'filled' : ''} ${readOnly ? 'readonly' : ''}`}
          onClick={() => onChange?.(star === value ? 0 : star)}
          disabled={readOnly}
          aria-label={`${star}점`}
        >
          ★
        </button>
      ))}
    </span>
  );
};

export default StarRating;
