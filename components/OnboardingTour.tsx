
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
        targetId: 'nav-help-center',
        titleKey: 'onboarding.step5.title',
        contentKey: 'onboarding.step5.content',
        position: 'bottom'
    },
    {
        targetId: 'help-button',
        titleKey: 'onboarding.step6.title',
        contentKey: 'onboarding.step6.content',
        position: 'top'
    }
];

const THERAPIST_STEPS: TourStep[] = [
    {
        targetId: 'therapist-stats',
        titleKey: 'onboarding.therapist.step1.title',
        contentKey: 'onboarding.therapist.step1.content',
        position: 'bottom'
    },
    {
        targetId: 'add-patient-btn',
        titleKey: 'onboarding.therapist.step2.title',
        contentKey: 'onboarding.therapist.step2.content',
        position: 'bottom'
    },
    {
        targetId: 'recent-activity',
        titleKey: 'onboarding.therapist.step3.title',
        contentKey: 'onboarding.therapist.step3.content',
        position: 'top'
    },
    {
        targetId: 'sidebar-nav',
        titleKey: 'onboarding.therapist.step4.title',
        contentKey: 'onboarding.therapist.step4.content',
        position: 'right'
    },
    {
        targetId: 'nav-help-center',
        titleKey: 'onboarding.therapist.step5.title',
        contentKey: 'onboarding.therapist.step5.content',
        position: 'bottom'
    },
    {
        targetId: 'help-button',
        titleKey: 'onboarding.therapist.step6.title',
        contentKey: 'onboarding.therapist.step6.content',
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
        const padding = 16;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const tooltipWidth = Math.min(320, viewportWidth - (padding * 2));
        const estimatedHeight = 280;

        if (!targetRect) {
            return {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: tooltipWidth
            };
        }

        let top = 0;
        let left = 0;

        switch (step.position) {
            case 'bottom':
                top = targetRect.bottom + padding;
                left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
                break;
            case 'top':
                top = targetRect.top - padding - estimatedHeight;
                left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
                break;
            case 'left':
                top = targetRect.top + targetRect.height / 2 - estimatedHeight / 2;
                left = targetRect.left - padding - tooltipWidth;
                break;
            case 'right':
                top = targetRect.top + targetRect.height / 2 - estimatedHeight / 2;
                left = targetRect.right + padding;
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

        // Help button override: show up and to the left
        if (step.targetId === 'help-button' || step.targetId === 'help-button-mobile') {
            top = targetRect.top - padding - estimatedHeight;
            left = targetRect.left - padding - tooltipWidth;
        }

        // Clamp to viewport so the tooltip never overflows
        left = Math.max(padding, left);
        left = Math.min(left, viewportWidth - padding - tooltipWidth);
        top = Math.max(padding, top);
        top = Math.min(top, viewportHeight - padding - estimatedHeight);

        return {
            top,
            left,
            width: tooltipWidth
        };
    };

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden h-full w-full">
            <AnimatePresence>
                {/* Overlay backdrop with a hole */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 pointer-events-auto"
                    style={{
                        maskImage: targetRect ? `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 1.5}px, black ${Math.max(targetRect.width, targetRect.height) / 1.5 + 5}px)` : 'none',
                        WebkitMaskImage: targetRect ? `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 1.5}px, black ${Math.max(targetRect.width, targetRect.height) / 1.5 + 5}px)` : 'none',
                    }}
                    onClick={stopTour}
                />

                {/* Tooltip */}
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute bg-white rounded-xl shadow-2xl p-6 pointer-events-auto border border-slate-200"
                    style={getTooltipStyle()}
                >
                    <button 
                        onClick={stopTour}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <p className="text-xs font-bold text-uib-blue uppercase tracking-widest mb-2">
                        {t('onboarding.stepCounter', { current: currentStep + 1, total: steps.length })}
                    </p>
                    
                    <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
                        {t(step.titleKey)}
                    </h3>
                    
                    <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                        {t(step.contentKey)}
                    </p>

                    <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                            {steps.map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentStep ? 'bg-uib-blue' : 'bg-slate-200'}`}
                                />
                            ))}
                        </div>

                        <div className="flex gap-2">
                            {!isFirst && (
                                <button
                                    onClick={handlePrev}
                                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-4 py-2 bg-uib-blue text-white rounded-lg font-bold text-sm hover:bg-[#004C8C] transition-colors shadow-sm"
                            >
                                {isLast ? t('onboarding.finish') : t('onboarding.next')}
                                {!isLast && <ChevronRight size={16} />}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
