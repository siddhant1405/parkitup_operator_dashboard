"use client"

import type { Control } from "react-hook-form"

import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { timePeriodValues, type SiteFormValues } from "@/features/sites/schemas/site"

interface TimeOfDayFieldProps {
  control: Control<SiteFormValues>
  name: "operatingHours.start" | "operatingHours.end"
  label: string
}

export function TimeOfDayField({ control, name, label }: TimeOfDayFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <FormField
        control={control}
        name={`${name}.time`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="flex items-center gap-2">
              <FormControl>
                <Input placeholder="9:00" className="w-24" {...field} />
              </FormControl>
              <FormField
                control={control}
                name={`${name}.period`}
                render={({ field: periodField }) => (
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={periodField.value}
                    onValueChange={(value) => {
                      if (value) periodField.onChange(value)
                    }}
                  >
                    {timePeriodValues.map((value) => (
                      <ToggleGroupItem key={value} value={value}>
                        {value}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                )}
              />
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
