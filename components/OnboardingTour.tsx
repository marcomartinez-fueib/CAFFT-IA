
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
        targetId: 'help-button',
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

    useEffect(() => {
        if (!isTourActive) return;

        const updateRect = () => {
            const step = steps[currentStep];
            let element = document.getElementById(step.targetId);
            
            // Try mobile ID if desktop not found
            if (!element) {
                element = document.getElementById(`${step.targetId}-mobile`);
            }
            
            if (element) {
                // Multi-stage update to handle layout shifts
                const update = () => {
                    const rect = element.getBoundingClientRect();
                    if (rect.width > 0) {
                        setTargetRect(rect);
                        const style = window.getComputedStyle(element);
                        const isFixed = style.position === 'fixed';
                        if (!isFixed && rect.top !== 0) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                };
                
                update();
                requestAnimationFrame(update);
                setTimeout(update, 100);
            } else {
                setTargetRect(null);
            }
        };

        updateRect();
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect);

        return () => {
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect);
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
        const estimatedHeight = 280; // Safer estimate for vertical clamping

        let top = 0;
        let left = 0;
        let x = '-50%';
        let y = '-50%';

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
            case 'center':
            default:
                return { 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    width: tooltipWidth
                };
        }

        // Target-specific adjustments (Help Button at bottom right)
        if (step.targetId === 'help-button' || step.targetId === 'help-button-mobile') {
            // Push it further "up and left" if it's the help button
            // In mobile or desktop, help button is usually bottom-right
            left = targetRect.left - padding - 20;
            top = targetRect.top - padding - 20;
            x = '-100%';
            y = '-100%';
            
            // Boundary check for being too far left
            if (left - tooltipWidth < padding) {
                left = padding + tooltipWidth;
            }
            // Boundary check for being too far up
            if (top - estimatedHeight < padding) {
                top = padding + estimatedHeight;
            }

            return {
                top,
                left,
                transform: `translate(${x}, ${y})`,
                width: tooltipWidth
            };
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

        // Vertical Clamping
        if (y === '0%') {
            if (top + estimatedHeight > viewportHeight - padding) {
                top = targetRect.top - padding;
                y = '-100%';
            }
        } else if (y === '-100%') {
            if (top - estimatedHeight < padding) {
                top = targetRect.bottom + padding;
                y = '0%';
            }
        } else if (y === '-50%') {
            const half = estimatedHeight / 2;
            if (top - half < padding) {
                top = padding + half;
            } else if (top + half > viewportHeight - padding) {
                top = viewportHeight - padding - half;
            }
        }

        return {
            top,
            left,
            transform: `translate(${x}, ${y})`,
            width: tooltipWidth
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
                    className="absolute inset-0 bg-black/60 pointer-events-auto cursor-default"
                    onClick={stopTour}
                >
                    <svg className="w-full h-full">
                        <defs>
                            <mask id="tour-mask">
                                <rect width="100%" height="100%" fill="white" />
                                {targetRect && (
                                    <rect 
                                        x={targetRect.left - 4} 
                                        y={targetRect.top - 4} 
                                        width={targetRect.width + 8} 
                                        height={targetRect.height + 8} 
                                        rx={8} 
                                        fill="black" 
                                    />
                                )}
                                {step.position === 'center' && !targetRect && (
                                    <rect x="0" y="0" width="0" height="0" fill="black" />
                                )}
                            </mask>
                        </defs>
                        <rect width="100%" height="100%" fill="currentColor" mask="url(#tour-mask)" />
                    </svg>
                </motion.div>

                {/* Tooltip */}
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute bg-white rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.3)] p-6 sm:p-8 pointer-events-auto border border-slate-100 ring-1 ring-black/5"
                    style={getTooltipStyle()}
                >
                    <button 
                        onClick={stopTour}
                        className="absolute top-5 right-5 text-slate-300 hover:text-slate-500 transition-colors p-1"
                        title={t('onboarding.finish')}
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>

                    <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-sky-50 text-sky-600 rounded-lg mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {t('onboarding.stepCounter', { current: currentStep + 1, total: steps.length })}
                        </span>
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-3 leading-tight tracking-tight">
                        {t(step.titleKey)}
                    </h3>
                    
                    <p className="text-sm sm:text-base text-slate-600 mb-8 leading-relaxed font-medium">
                        {t(step.contentKey)}
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                        <div className="flex gap-1.5">
                            {steps.map((_, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setCurrentStep(i)}
                                    className={`w-2 h-2 rounded-full transition-all ${i === currentStep ? 'bg-uib-blue w-6' : 'bg-slate-200 hover:bg-slate-300'}`}
                                    aria-label={`Go to step ${i + 1}`}
                                />
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            {isFirst && (
                                <button
                                    onClick={stopTour}
                                    className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                                >
                                    {t('therapistDashboard.addPatientModal.cancelButton')}
                                </button>
                            )}
                            
                            {!isFirst && (
                                <button
                                    onClick={handlePrev}
                                    className="flex items-center justify-center p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all font-bold group"
                                >
                                    <ChevronLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
                                </button>
                            )}
                            
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-2.5 bg-uib-blue text-white rounded-xl font-black text-sm hover:bg-[#004C8C] transition-all shadow-lg shadow-sky-100 hover:shadow-xl hover:-translate-y-0.5"
                            >
                                {isLast ? t('onboarding.finish') : t('onboarding.next')}
                                {!isLast && <ChevronRight size={18} />}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
