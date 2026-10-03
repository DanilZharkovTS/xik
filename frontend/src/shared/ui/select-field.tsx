import { Children, isValidElement } from 'react'
import type { ChangeEvent, ReactElement, ReactNode } from 'react'

import { Picker } from './picker'
import type { PickerOption } from './picker'

type SelectFieldProps = {
  label: string
  value: string
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
  // Варіанти задаються як <option>, тож виклики лишаються такими самими, як зі звичайним select.
  children: ReactNode
  className?: string
  hideLabel?: boolean
  pill?: boolean
  disabled?: boolean
}

const toOptions = (children: ReactNode): PickerOption[] =>
  Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string; children?: ReactNode }>(child)) return []
    const text = Children.toArray(child.props.children).join('')
    return [{ value: String(child.props.value ?? text), label: text }]
  })

export function SelectField({
  onChange,
  children,
  ...props
}: SelectFieldProps): ReactElement {
  return (
    <Picker
      {...props}
      options={toOptions(children)}
      onChange={(value) => onChange({ target: { value } } as ChangeEvent<HTMLSelectElement>)}
    />
  )
}
