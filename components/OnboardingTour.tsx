
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOnboarding } from '../hooks/useOnboarding';
import { useLanguage } from '../hooks/useLanguage';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface TourStep {
    targetId: string;
    titleKey: string;
    contentKey: string;
    position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const PATIENT_STEPS: TourStep[] = [
    {
        targetId: 'nav-home',
        titleKey: 'onboarding.step1.title',
        contentKey: 'onboarding.step1.content',
        position: 'bottom'
    },
    {
        targetId: 'nav-qpvii',
        titleKey: 'onboarding.step2.title',
        contentKey: 'onboarding.step2.content',
        position: 'bottom'
    },
    {
        targetId: 'nav-exposure',
        titleKey: 'onboarding.step3.title',
        contentKey: 'onboarding.step3.content',
        position: 'bottom'
    },
    {
        targetId: 'nav-evolution',
        titleKey: 'onboarding.step4.title',
        contentKey: 'onboarding.step4.content',
        position: 'bottom'
    },
    {
        targetId: 'help-button',
        titleKey: 'onboarding.step5.title',
        contentKey: 'onboarding.step5.content',
        position: 'top'
    }
];

const THERAPIST_STEPS: TourStep[] = [
    {
        targetId: 'onboarding-welcome',
        titleKey: 'onboarding.therapist.step1.title',
        contentKey: 'onboarding.therapist.step1.content',
        position: 'center'
    },
    {
        targetId: 'therapist-stats',
        titleKey: 'onboarding.therapist.step2.title',
        contentKey: 'onboarding.therapist.step2.content',
        position: 'bottom'
    },
    {
        targetId: 'phase-distribution',
        titleKey: 'onboarding.therapist.step3.title',
        contentKey: 'onboarding.therapist.step3.content',
        position: 'bottom'
    },
    {
        targetId: 'recent-activity',
        titleKey: 'onboarding.therapist.step4.title',
        contentKey: 'onboarding.therapist.step4.content',
        position: 'top'
    },
    {
        targetId: 'add-patient-btn',
        titleKey: 'onboarding.therapist.step5.title',
        contentKey: 'onboarding.therapist.step5.content',
        position: 'bottom'
    },
    {
        targetId: 'patient-table',
        titleKey: 'onboarding.therapist.step6.title',
        contentKey: 'onboarding.therapist.step6.content',
        position: 'top'
    },
    {
        targetId: 'ai-log',
        titleKey: 'onboarding.therapist.step7.title',
        contentKey: 'onboarding.therapist.step7.content',
        position: 'top'
    },
    {
        targetId: 'tour-help-button',
        titleKey: 'onboarding.therapist.step8.title',
        contentKey: 'onboarding.therapist.step8.content',
        position: 'top'
    }
];

export const OnboardingTour: React.FC = () => {
    const { isTourActive, tourType, stopTour } = useOnboarding();
    const { t } = useLanguage();
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const steps = tourType === 'therapist' ? THERAPIST_STEPS : PATIENT_STEPS;

    useEffect(() => {
        if (isTourActive) {
            setCurrentStep(0);
        }
    }, [isTourActive]);

    // Single source of truth for target rect updates
    const updateTargetRect = () => {
        if (!isTourActive) return;
        
        const step = steps[currentStep];
        if (!step) return;

        if (step.position === 'center') {
            setTargetRect(null);
            return;
        }

        let element = document.getElementById(step.targetId);
        if (!element) {
            element = document.getElementById(`${step.targetId}-mobile`);
        }

        if (element) {
            const rect = element.getBoundingClientRect();
            // Only update if dimensions have actually changed or it moved
            if (rect.width > 0) {
                setTargetRect(rect);
            } else {
                setTargetRect(null);
            }
        } else {
            setTargetRect(null);
        }
    };

    // Handle step change effects (scrolling)
    useEffect(() => {
        if (!isTourActive) return;

        const step = steps[currentStep];
        if (!step || step.position === 'center') {
            setTargetRect(null);
            return;
        }

        const scrollToTarget = () => {
            let element = document.getElementById(step.targetId);
            if (!element) {
                element = document.getElementById(`${step.targetId}-mobile`);
            }

            if (element) {
                const rect = element.getBoundingClientRect();
                const style = window.getComputedStyle(element);
                const isFixed = style.position === 'fixed';
                
                // Only scroll if not already comfortably in view
                const isVisible = rect.top >= 100 && rect.bottom <= window.innerHeight - 100;
                
                if (!isFixed && !isVisible) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                
                updateTargetRect();
            }
        };

        // Delay slightly for any transitions or data loading
        const timer = setTimeout(scrollToTarget, 100);
        return () => clearTimeout(timer);
    }, [currentStep, isTourActive, steps]);

    // Handle continuous updates for layout changes/scrolling (without scrollIntoView)
    useEffect(() => {
        if (!isTourActive) return;

        updateTargetRect();
        
        window.addEventListener('resize', updateTargetRect);
        window.addEventListener('scroll', updateTargetRect, { passive: true });
        
        // Polling as a fallback for dynamic content
        const interval = setInterval(updateTargetRect, 500);

        return () => {
            window.removeEventListener('resize', updateTargetRect);
            window.removeEventListener('scroll', updateTargetRect);
            clearInterval(interval);
        };
    }, [isTourActive, currentStep, steps]);

    if (!isTourActive) return null;

    const step = steps[currentStep];
    const isFirst = currentStep === 0;
    const isLast = currentStep === steps.length - 1;

    const handleNext = () => {
        if (isLast) {
            stopTour();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (!isFirst) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const getTooltipStyle = () => {
        if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 320 };

        const padding = 16;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const tooltipWidth = Math.min(320, viewportWidth - (padding * 2));
        const estimatedHeight = 350; // Safer estimate for vertical clamping

        let top = 0;
        let left = 0;
        let x = '-50%';
        let y = '-50%';

        if (step.position === 'center' || !targetRect) {
            return { 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                width: tooltipWidth,
                maxHeight: '85vh',
                overflowY: 'auto' as const
            };
        }

        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;

        switch (step.position) {
            case 'bottom':
                top = targetRect.bottom + padding;
                left = targetCenterX;
                y = '0%';
                break;
            case 'top':
                top = targetRect.top - padding;
                left = targetCenterX;
                y = '-100%';
                break;
            case 'left':
                top = targetCenterY;
                left = targetRect.left - padding;
                x = '-100%';
                break;
            case 'right':
                top = targetCenterY;
                left = targetRect.right + padding;
                x = '0%';
                break;
            default:
                break;
        }

        // Special handling for help button (usually in corner)
        if (step.targetId.includes('help-button')) {
            left = targetRect.left - padding;
            top = targetRect.top - padding;
            x = '-100%';
            y = '-100%';
        }

        // Vertical Clamping - Ensure it doesn't go off top/bottom
        if (y === '0%') {
            if (top + estimatedHeight > viewportHeight - padding) {
                // Not enough room below, try above
                top = targetRect.top - padding;
                y = '-100%';
            }
        } else if (y === '-100%') {
            if (top - estimatedHeight < padding) {
                // Not enough room above, try below
                top = targetRect.bottom + padding;
                y = '0%';
            }
        }

        // Ensure it stays on screen vertically regardless of position
        if (y === '0%') {
             top = Math.max(padding, Math.min(top, viewportHeight - estimatedHeight - padding));
        } else if (y === '-100%') {
             top = Math.max(padding + estimatedHeight, Math.min(top, viewportHeight - padding));
        }

        // Horizontal Clamping
        if (x === '-50%') {
            const half = tooltipWidth / 2;
            if (left - half < padding) {
                left = padding;
                x = '0%';
            } else if (left + half > viewportWidth - padding) {
                left = viewportWidth - padding;
                x = '-100%';
            }
        } else if (x === '-100%') {
            if (left - tooltipWidth < padding) {
                left = padding + tooltipWidth;
            }
        } else if (x === '0%') {
            if (left + tooltipWidth > viewportWidth - padding) {
                left = viewportWidth - padding - tooltipWidth;
            }
        }

        return {
            top,
            left,
            transform: `translate(${x}, ${y})`,
            width: tooltipWidth,
            maxHeight: '85vh',
            overflowY: 'auto' as const
        };
    };

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden h-full w-full">
            <AnimatePresence>
                {/* Overlay backdrop with a hole using SVG mask for better cross-browser compatibility and rounded corners */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 pointer-events-auto cursor-default"
                >
                    <svg className="w-full h-full">
                        <defs>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="6" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                            <mask id="tour-mask">
                                <rect width="100%" height="100%" fill="white" />
                                {targetRect && (
                                    <rect 
                                        x={targetRect.left - 6} 
                                        y={targetRect.top - 6} 
                                        width={targetRect.width + 12} 
                                        height={targetRect.height + 12} 
                                        rx={12} 
                                        fill="black" 
                                    />
                                )}
                                {step.position === 'center' && !targetRect && (
                                    <rect x="0" y="0" width="0" height="0" fill="black" />
                                )}
                            </mask>
                        </defs>
                        
                        {/* The backdrop overlay */}
                        <rect width="100%" height="100%" fill="rgba(15, 23, 42, 0.85)" mask="url(#tour-mask)" />
                        
                        {/* The spotlight light effect (focus ring) */}
                        {targetRect && (
                            <motion.rect
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ 
                                    opacity: [0.4, 0.7, 0.4],
                                    scale: [1, 1.02, 1],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                x={targetRect.left - 8}
                                y={targetRect.top - 8}
                                width={targetRect.width + 16}
                                height={targetRect.height + 16}
                                rx={14}
                                fill="none"
                                stroke="white"
                                strokeWidth="2"
                                style={{ filter: 'url(#glow)' }}
                            />
                        )}
                    </svg>
                </motion.div>

                {/* Tooltip */}
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute bg-white rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.3)] pointer-events-auto border border-slate-100 ring-1 ring-black/5 flex flex-col"
                    style={getTooltipStyle()}
                >
                    <div className="p-6 sm:p-8 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-sky-50 text-sky-600 rounded-lg">
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {t('onboarding.stepCounter', { current: currentStep + 1, total: steps.length })}
                                </span>
                            </div>
                            <button 
                                onClick={stopTour}
                                className="text-slate-300 hover:text-slate-500 transition-colors p-1 -mt-1 -mr-1"
                                title={t('onboarding.finish')}
                            >
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto pr-1 flex-grow">
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-3 leading-tight tracking-tight">
                                {t(step.titleKey)}
                            </h3>
                            
                            <p className="text-sm sm:text-base text-slate-600 mb-6 leading-relaxed font-medium">
                                {t(step.contentKey)}
                            </p>
                        </div>
                        
                        <div className="pt-6 border-t border-slate-50 mt-auto">
                            <div className="flex items-center justify-between">
                                <div className="flex gap-1.5 overflow-hidden">
                                    {steps.map((_, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => setCurrentStep(i)}
                                            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentStep ? 'bg-uib-blue w-6' : 'bg-slate-200 hover:bg-slate-300'}`}
                                            aria-label={`Go to step ${i + 1}`}
                                        />
                                    ))}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={stopTour}
                                        className="px-3 py-2 text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                                    >
                                        {t('onboarding.cancel')}
                                    </button>
                                    
                                    {!isFirst && (
                                        <button
                                            onClick={handlePrev}
                                            className="flex items-center justify-center p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all font-bold group"
                                        >
                                            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={handleNext}
                                        className="flex items-center gap-2 px-5 py-3 bg-uib-blue text-white rounded-xl font-black text-xs sm:text-sm hover:bg-[#004C8C] transition-all shadow-lg shadow-sky-100 hover:shadow-xl hover:-translate-y-0.5"
                                    >
                                        {isLast ? t('onboarding.finish') : t('onboarding.next')}
                                        {!isLast && <ChevronRight size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
