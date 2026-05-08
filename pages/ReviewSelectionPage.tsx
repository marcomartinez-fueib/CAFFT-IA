

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { PageTitle } from '../components/PageTitle';
import { SectionCard } from '../components/SectionCard';
import { ExposureSceneKey } from '../types';
import { CANONICAL_FLIGHT_STAGES_ORDER } from '../constants';

const sceneTranslationKeys: Record<ExposureSceneKey, string> = {
  psychoed: 'evolution.scene_psychoed',
  preparation: 'evolution.scene_preparation',
  boarding: 'evolution.scene_boarding',
  takeoff: 'evolution.scene_takeoff',
  inflight: 'evolution.scene_inflight',
  landing: 'evolution.scene_landing',
  accidents: 'evolution.scene_accidents',
};


export const ReviewSelectionPage: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedScenes, setSelectedScenes] = useState<Set<ExposureSceneKey>>(new Set());
    const [error, setError] = useState<string | null>(null);

    const { qpviiTimestamp } = (location.state as { qpviiTimestamp?: number }) || {};

    if (!qpviiTimestamp) {
        // Redirect if state is missing
        navigate('/evolution', { replace: true });
        return null;
    }

    const handleToggleScene = (sceneKey: ExposureSceneKey) => {
        setError(null);
        setSelectedScenes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sceneKey)) {
                newSet.delete(sceneKey);
            } else {
                newSet.add(sceneKey);
            }
            return newSet;
        });
    };

    const handleStartReview = () => {
        if (selectedScenes.size === 0) {
            setError(t('review.noSelectionError'));
            return;
        }
        navigate('/exposure', {
            state: {
                reviewScenes: Array.from(selectedScenes),
                reviewSessionTimestamp: Date.now(), // Unique timestamp for this review session
                originalQpviiTimestamp: qpviiTimestamp, // Pass the original QPV-II timestamp along
            },
        });
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <PageTitle title={t('review.pageTitle')} />
            <SectionCard>
                <p className="mb-6 text-gray-700">{t('review.intro')}</p>
                <div className="space-y-4 mb-8">
                    {CANONICAL_FLIGHT_STAGES_ORDER.map(sceneKey => (
                        <label
                            key={sceneKey}
                            htmlFor={`scene-${sceneKey}`}
                            className="flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md hover:border-sky-400"
                        >
                            <input
                                type="checkbox"
                                id={`scene-${sceneKey}`}
                                checked={selectedScenes.has(sceneKey)}
                                onChange={() => handleToggleScene(sceneKey)}
                                className="h-5 w-5 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                            />
                            <span className="ml-4 font-medium text-gray-800">{t(sceneTranslationKeys[sceneKey])}</span>
                        </label>
                    ))}
                </div>

                {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}

                <div className="flex flex-col sm:flex-row gap-4">
                     <button
                        onClick={handleStartReview}
                        className="w-full sm:w-auto flex-1 justify-center py-2.5 px-5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                    >
                        {t('review.startReview')}
                    </button>
                    <button
                        onClick={() => navigate('/evolution')}
                        className="w-full sm:w-auto flex-1 justify-center py-2.5 px-5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
                    >
                        {t('exposureHierarchy.exitButton')}
                    </button>
                </div>
            </SectionCard>
        </div>
    );
};
