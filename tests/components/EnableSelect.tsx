import { SelectValue } from "@radix-ui/react-select";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";

export type EnabledState = "on" | "off";

interface EnableSelectProps {
  onChange(v: EnabledState): void;
  value: EnabledState;
}

export function EnableSelect({ value, onChange }: EnableSelectProps) {
  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger className="w-max gap-2 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="on" className="text-xs">
          On
        </SelectItem>
        <SelectItem value="off" className="text-xs">
          Off
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
