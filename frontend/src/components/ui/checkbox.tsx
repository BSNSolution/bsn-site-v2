import { forwardRef, InputHTMLAttributes } from 'react'
import { Check } from 'lucide-react'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Checkbox glass-style. Aceita label e description. Controlado ou não.
 *
 * Usage:
 *   <Checkbox checked={value} onChange={(e) => setValue(e.target.checked)} label="Publicado" />
 *   <Checkbox label="Ativo" description="Aparece no site" size="sm" />
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, size = 'md', className = '', checked, disabled, ...rest }, ref) => {
    const boxSize = size === 'sm' ? 14 : size === 'lg' ? 22 : 18
    const iconSize = size === 'sm' ? 10 : size === 'lg' ? 16 : 12
    const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'

    return (
      <label
        className={`inline-flex items-start gap-2.5 cursor-pointer select-none group ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        <span className="relative inline-flex items-center justify-center shrink-0" style={{ width: boxSize, height: boxSize, marginTop: 2 }}>
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            className="peer absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
            {...rest}
          />
          <span
            className="absolute inset-0 rounded-[5px] border transition-all
              border-white/15 bg-white/[0.04]
              peer-hover:border-white/25 peer-hover:bg-white/[0.08]
              peer-focus-visible:ring-2 peer-focus-visible:ring-primary/60
              peer-checked:bg-primary peer-checked:border-primary
              peer-checked:shadow-[0_0_0_1px_rgba(122,91,255,0.4),0_4px_12px_-2px_rgba(122,91,255,0.5)]"
          />
          <Check
            className="relative z-10 text-white opacity-0 peer-checked:opacity-100 transition"
            style={{ width: iconSize, height: iconSize, strokeWidth: 3 }}
          />
        </span>
        {(label || description) && (
          <span className={`flex flex-col gap-0.5 ${textSize}`}>
            {label && <span className="leading-snug text-foreground">{label}</span>}
            {description && <span className="text-[11px] text-muted-foreground leading-snug">{description}</span>}
          </span>
        )}
      </label>
    )
  }
)
Checkbox.displayName = 'Checkbox'

export default Checkbox
