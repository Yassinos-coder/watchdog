import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const CODE_LENGTH = 6;

interface CodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  id?: string;
}

export function CodeField({ value, onChange, onComplete, disabled, id }: CodeFieldProps) {
  return (
    <InputOTP
      id={id}
      maxLength={CODE_LENGTH}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      disabled={disabled}
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]*"
    >
      <InputOTPGroup>
        {Array.from({ length: CODE_LENGTH }, (_, index) => (
          <InputOTPSlot key={index} index={index} className="size-11 text-base sm:size-12" />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
