import { TextField } from '@/src/shared/ui/text-field'
import { AuthInputProps } from '../auth.types'

export const AuthInput = ({
  name,
  label,
  value,
  placeholder,
  type = 'text',
  autoComplete,
  error,
  onChange,
}: AuthInputProps) => {
  return (
    <div className="space-y-1">
      <TextField
        id={name}
        name={name}
        label={label}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={error ? 'border-red-500' : undefined}
      />

      {error && (
        <p id={`${name}-error`} className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}
