import { AuthInputProps } from "../auth.types"


export const AuthInput = ({
  name,
  value,
  placeholder,
  type = 'text',
  error,
  onChange,
}: AuthInputProps) => {
  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="block font-mono text-xs uppercase tracking-widest text-foreground-muted"
      >
        {name}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={!!error}
        className={[
          'w-full border border-border bg-background px-4 py-3',
          'font-mono text-sm text-foreground',
          'outline-none transition-colors',
          'placeholder:text-foreground-muted',
          'focus:border-foreground',
          error ? 'border-red-500' : '',
        ].join(' ')}
      />

      {error && (
        <p className="font-mono text-xs text-red-500">
          <span className="mr-2">&gt;</span>
          {error}
        </p>
      )}
    </div>
  )
}