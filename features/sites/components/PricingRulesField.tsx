"use client"

import { useFieldArray, useWatch, type Control } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  dayTypeValues,
  rateTypeValues,
  type SiteFormValues,
} from "@/features/sites/schemas/site"
import { dayTypeLabels, rateTypeLabels } from "@/features/sites/utils/labels"

function generateRuleId() {
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function PricingRuleCard({
  control,
  index,
  onRemove,
}: {
  control: Control<SiteFormValues>
  index: number
  onRemove: () => void
}) {
  const rateType = useWatch({ control, name: `pricingRules.${index}.rateType` })

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Rule {index + 1}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-11 sm:size-7"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField
          control={control}
          name={`pricingRules.${index}.dayType`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Applies to</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {dayTypeValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {dayTypeLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`pricingRules.${index}.rateType`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rate type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {rateTypeValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {rateTypeLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {rateType !== "one-time" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            control={control}
            name={`pricingRules.${index}.startTime`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start time (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 8:00 AM" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`pricingRules.${index}.endTime`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>End time (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 8:00 PM" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <FormField
        control={control}
        name={`pricingRules.${index}.amount`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Amount</FormLabel>
            <FormControl>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted-foreground">
                  ₹
                </span>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  className="pl-6 pr-2.5"
                  {...field}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

export function PricingRulesField({
  control,
}: {
  control: Control<SiteFormValues>
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "pricingRules",
  })

  return (
    <div className="flex flex-col gap-4">
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No pricing rules yet. Add at least one to continue.
        </p>
      )}

      {fields.map((rule, index) => (
        <PricingRuleCard
          key={rule.id}
          control={control}
          index={index}
          onRemove={() => remove(index)}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() =>
          append({
            id: generateRuleId(),
            dayType: "all",
            startTime: "",
            endTime: "",
            rateType: "hourly",
            amount: 0,
          })
        }
      >
        <Plus className="h-4 w-4" />
        Add pricing rule
      </Button>
    </div>
  )
}
