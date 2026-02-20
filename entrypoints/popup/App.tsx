import { Button } from '@/components/ui/button';

function App() {
  return (
    <div className='w-[320px] bg-transparent p-4 flex flex-col items-center gap-4'>
      <h1 className='text-2xl font-bold'>Popup</h1>
      <Button className='w-full' onClick={() => alert('Button clicked!')}>
        Click me
      </Button>
    </div>
  );
}

export default App;
