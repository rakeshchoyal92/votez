import { useState, useEffect, useRef, useCallback } from 'react'
import { HexColorPicker } from 'react-colorful'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Input } from './input'

interface ColorPickerProps {
  label: string
  value: string
  defaultValue: string
  onChange: (color: string) => void
}

export function ColorPicker({ label, value, defaultValue, onChange }: ColorPickerProps) {
  const externalValue = value || defaultValue
  const [localColor, setLocalColor] = useState(externalValue)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  // Sync from parent when external value changes (e.g. reset, server update)
  useEffect(() => {
    setLocalColor(externalValue)
  }, [externalValue])

  const commitColor = useCallback(
    (color: string) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => onChange(color), 300)
    },
    [onChange]
  )

  // Cleanup
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const handlePickerChange = (color: string) => {
    setLocalColor(color)
    commitColor(color)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
      setLocalColor(v)
      if (v.length === 7) commitColor(v)
    }
  }

  const handleReset = () => {
    setLocalColor(defaultValue)
    if (timerRef.current) clearTimeout(timerRef.current)
    onChange(defaultValue)
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-foreground">{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-7 h-7 rounded-lg border border-border/50 shadow-sm cursor-pointer transition-all hover:scale-105 hover:shadow-md"
            style={{ backgroundColor: localColor }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3 space-y-3" align="end">
          <HexColorPicker color={localColor} onChange={handlePickerChange} />
          <div className="flex items-center gap-2">
            <Input
              value={localColor}
              onChange={handleInputChange}
              className="h-7 text-xs font-mono flex-1"
              maxLength={7}
            />
            {value && value !== defaultValue && (
              <button
                type="button"
                onClick={handleReset}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
