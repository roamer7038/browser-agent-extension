import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Settings2 } from 'lucide-react';

interface ModelParamsSelectorProps {
  temperature?: number;
  topP?: number;
  onParamsChange: (temperature: number, topP: number) => void;
}

export function ModelParamsSelector({ temperature = 0.7, topP = 1.0, onParamsChange }: ModelParamsSelectorProps) {
  return (
    <div className='space-y-4 my-2'>
      <div className='space-y-6 pt-2 pb-2 pl-2 pr-2'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <Label className='text-sm'>Temperature</Label>
            <span className='text-xs text-muted-foreground w-8 text-right'>{temperature.toFixed(1)}</span>
          </div>
          <Slider
            min={0}
            max={2}
            step={0.1}
            value={[temperature]}
            onValueChange={([val]) => onParamsChange(val, topP)}
          />
          <p className='text-[11px] text-muted-foreground'>
            出力のランダム性を制御します。高い値はより創造的に、低い値はより決定論的になります。
          </p>
        </div>

        <div className='separator h-px bg-border my-4' />

        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <Label className='text-sm'>Top P</Label>
            <span className='text-xs text-muted-foreground w-8 text-right'>{topP.toFixed(2)}</span>
          </div>
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={[topP]}
            onValueChange={([val]) => onParamsChange(temperature, val)}
          />
          <p className='text-[11px] text-muted-foreground'>
            確率の累積値に基づいて出力トークンを制限します。1.0で制限なしになります。
          </p>
        </div>
      </div>
    </div>
  );
}
