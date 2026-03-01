import { Settings2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface MiscSettingsProps {
  recursionLimit?: number;
  onRecursionLimitChange: (value: number | undefined) => void;
}

export function MiscSettings({ recursionLimit, onRecursionLimitChange }: MiscSettingsProps) {
  return (
    <div>
      <h2 className='text-lg font-semibold tracking-tight flex items-center gap-2 mb-4'>
        <Settings2 className='w-5 h-5' />
        その他
      </h2>
      <Card className='py-2'>
        <div className='p-4 bg-card text-card-foreground'>
          <div className='space-y-1.5'>
            <Label htmlFor='recursion-limit' className='text-sm font-medium'>
              Recursion Limit
              <span className='text-xs text-muted-foreground font-normal ml-2'>
                LangGraphの最大再帰回数（デフォルト: 100）
              </span>
            </Label>
            <Input
              id='recursion-limit'
              type='number'
              min={1}
              step={1}
              placeholder='100'
              className='h-8 text-sm'
              value={recursionLimit || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                onRecursionLimitChange(isNaN(val) ? undefined : val);
              }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
