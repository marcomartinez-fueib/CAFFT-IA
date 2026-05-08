import React from 'react';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { PageTitle } from '../components/PageTitle.tsx';
import { SectionCard } from '../components/SectionCard.tsx';
import { PieChartDisplay } from '../components/PieChartDisplay.tsx';
import { PieChartDataItem } from '../types.ts';
import { PIE_CHART_COLORS } from '../constants.ts';
import { translations } from '../data/translations.ts'; // Import translations

// Define the structure of the raw data item from translations
interface RawPrevalenceChartItem {
  nameKey: string;
  value: number;
}

export const FearOfFlyingPage: React.FC = () => {
  const { t, language } = useLanguage(); // Destructure language

  // Directly access the array from the translations object
  const rawChartDataFromTranslations = translations[language].fearOfFlying.prevalence.chartData;
  
  // Ensure rawChartDataFromTranslations is an array before mapping, then transform to PieChartDataItem[]
  const translatedChartData: PieChartDataItem[] = Array.isArray(rawChartDataFromTranslations) 
    ? rawChartDataFromTranslations.map((item, index) => ({
        name: t(`fearOfFlying.prevalence.${item.nameKey}`), 
        value: item.value,
        fill: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
      }))
    : [];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageTitle title={t('fearOfFlying.title')} />
      <p className="text-lg text-gray-600 mb-8">{t('fearOfFlying.introduction')}</p>

      <SectionCard title={t('fearOfFlying.prevalence.title')}>
        <p className="mb-4 text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('fearOfFlying.prevalence.text') }} />
        <div className="my-6">
          {translatedChartData.length > 0 ? (
            <PieChartDisplay data={translatedChartData} />
          ) : (
            <p className="text-center text-gray-500">Chart data is currently unavailable.</p>
          )}
        </div>
      </SectionCard>
      
      <div className="grid md:grid-cols-2 gap-8">
        <SectionCard title={t('fearOfFlying.whoIsAffected.title')}>
          <p>{t('fearOfFlying.whoIsAffected.text')}</p>
            {/* Image removed */}
        </SectionCard>

        <SectionCard title={t('fearOfFlying.whatIsIt.title')}>
          <p className="mb-3">{t('fearOfFlying.whatIsIt.text1')}</p>
          <ul className="list-disc list-inside space-y-3">
            <li>
              <strong>{t('fearOfFlying.whatIsIt.physiological')}</strong>
              <p className="ml-4 text-sm text-gray-600">{t('fearOfFlying.whatIsIt.physiological_desc')}</p>
            </li>
            <li>
              <strong>{t('fearOfFlying.whatIsIt.cognitive')}</strong>
              <p className="ml-4 text-sm text-gray-600">{t('fearOfFlying.whatIsIt.cognitive_desc')}</p>
            </li>
            <li>
              <strong>{t('fearOfFlying.whatIsIt.behavioral')}</strong>
              <p className="ml-4 text-sm text-gray-600">{t('fearOfFlying.whatIsIt.behavioral_desc')}</p>
            </li>
          </ul>
            {/* Image removed */}
        </SectionCard>
      </div>
    </div>
  );
};