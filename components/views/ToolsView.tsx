import React, { useState, Suspense } from 'react';
import { ToolsSidebar, ToolType } from '../tools/ToolsSidebar';
import { TOOLS_MENU } from '../tools/constants';

// Lazy load all tools for better initial performance
const TimerTool = React.lazy(() => import('../tools/TimerTool').then(m => ({ default: m.TimerTool })));
const FocusMixer = React.lazy(() => import('../tools/FocusMixer').then(m => ({ default: m.FocusMixer })));
const CalculatorTool = React.lazy(() => import('../tools/CalculatorTool').then(m => ({ default: m.CalculatorTool })));
const ConverterTool = React.lazy(() => import('../tools/ConverterTool').then(m => ({ default: m.ConverterTool })));
const CurrencyConverterTool = React.lazy(() => import('../tools/CurrencyConverterTool').then(m => ({ default: m.CurrencyConverterTool })));
const TextAnalyzerTool = React.lazy(() => import('../tools/TextAnalyzerTool').then(m => ({ default: m.TextAnalyzerTool })));
const ClickerTool = React.lazy(() => import('../tools/ClickerTool').then(m => ({ default: m.ClickerTool })));
const BreathingTool = React.lazy(() => import('../tools/BreathingTool').then(m => ({ default: m.BreathingTool })));

// Loading fallback for tools
const ToolLoadingFallback = () => (
   <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
   </div>
);

const ToolsView: React.FC = () => {
   const [activeTool, setActiveTool] = useState<ToolType>('time');

   return (
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 animate-in fade-in duration-500 pb-20">
         {/* Sidebar */}
         <ToolsSidebar
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            menuItems={TOOLS_MENU}
         />

         {/* Content Area */}
         <div className="bg-slate-800/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-slate-700 shadow-xl min-h-[400px] flex flex-col justify-center relative">
            <Suspense fallback={<ToolLoadingFallback />}>
               {activeTool === 'time' && <TimerTool />}
               {activeTool === 'focus' && <FocusMixer />}
               {activeTool === 'calc' && <CalculatorTool />}
               {activeTool === 'convert' && <ConverterTool />}
               {activeTool === 'currency' && <CurrencyConverterTool />}
               {activeTool === 'text' && <TextAnalyzerTool />}
               {activeTool === 'clicker' && <ClickerTool />}
               {activeTool === 'breathing' && <BreathingTool />}
            </Suspense>
         </div>
      </div>
   );
};

export default ToolsView;

