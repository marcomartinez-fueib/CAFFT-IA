import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { PageTitle } from '../components/PageTitle';
import { SectionCard } from '../components/SectionCard';

interface ReferenceItem {
  key: string;
  htmlContent: string; // APA7 formatted reference as HTML string
}

export const ScientificFoundationPage: React.FC = () => {
  const { t } = useLanguage();

  // APA7 Formatted References
  // Note: DOIs are generally not available in the provided OCRs, so they are omitted.
  // Journal volume/issue/pages are included as per OCR.
  const references: ReferenceItem[] = [
    {
      key: 'bornas1995pc',
      htmlContent: 'Bornas, X. y Tortella-F. M. (1995). Descripción y análisis psicométrico de un instrumento de autoinforme para la evaluación del miedo a volar. <em>Psicología Conductual, 3</em>(1), 67–86.',
    },
    {
      key: 'bornas1999amc',
      htmlContent: 'Bornas, X. et al. (1999). Validación Factorial Del Cuestionario De Miedo a Volar. <em>Análisis y Modificación de Conducta, 25</em>(104), 885–907.',
    },
    {
      key: 'bornas2001cbp',
      htmlContent: 'Bornas, X., Fullana, M. A., Tortella-Feliu, M., Llabrés, J., & De La Banda, G. G. (2001). Computer-assisted therapy in the treatment of flight phobia: A case report. <em>Cognitive and Behavioral Practice, 8</em>(3), 234–240. <a href="https://doi.org/10.1016/S1077-7229(01)80058-4" target="_blank" rel="noopener noreferrer" class="text-sky-600 hover:underline">https://doi.org/10.1016/S1077-7229(01)80058-4</a>',
    },
    {
      key: 'bornas2001pr',
      htmlContent: 'Bornas, X. (2001). Computer-Assisted Exposure Treatment for Flight Phobia: a Controlled Study. <em>Psychotherapy Research, 11</em>(3), 259–273. <a href="https://doi.org/10.1093/ptr/11.3.259" target="_blank" rel="noopener noreferrer" class="text-sky-600 hover:underline">https://doi.org/10.1093/ptr/11.3.259</a>',
    },
    {
      key: 'bornas2002ijchp',
      htmlContent: 'Bornas, X., Tortella-Feliu, M., Llabrés, J., Muhlberger, A., Pauli, P., & Barceló, F. (2002). Clinical usefulness of a simulated exposure treatment for fear of flying. <em>International Journal of Clinical and Health Psychology, 2</em>, 247–262.',
    },
    {
      key: 'botella2004cpp',
      htmlContent: 'Botella-Arbona, C., Osma, J., García-Palacios, A., Quero, S., & Baños, R. M. (2004). Treatment of flying phobia using virtual reality: Data from a 1-year follow-up using a multiple baseline design. <em>Clinical Psychology and Psychotherapy, 11</em>(5), 311–323. <a href="https://doi.org/10.1002/cpp.404" target="_blank" rel="noopener noreferrer" class="text-sky-600 hover:underline">https://doi.org/10.1002/cpp.404</a>',
    },
    {
      key: 'bornas2004asc',
      htmlContent: 'Bornas, X., Llabrés, J., Noguera, M., M, A., López, Barceló, F., … Fullana, M. À. (2004). Self-implication and heart rate variability during simulated exposure to flight-related stimuli. <em>Anxiety, Stress and Coping, 17</em>(4), 331–339. <a href="https://doi.org/10.1080/10615800512331328777" target="_blank" rel="noopener noreferrer" class="text-sky-600 hover:underline">https://doi.org/10.1080/10615800512331328777</a>',
    },
    {
      key: 'bornas2006pr',
      htmlContent: 'Bornas, X., Tortella-Feliu, M., & Llabrés, J. (2006). Do all treatments work for flight phobia? Computer-assisted exposure versus a brief multicomponent nonexposure treatment. <em>Psychotherapy Research, 16</em>(1), 41–50. <a href="https://doi.org/10.1080/10503300500091058" target="_blank" rel="noopener noreferrer" class="text-sky-600 hover:underline">https://doi.org/10.1080/10503300500091058</a>',
    },
    {
      key: 'bornas2007bp',
      htmlContent: 'Bornas, X., Llabrés, J., Tortella-Feliu, M., Fullana, M. A., Montoya, P., López, A., … Gelabert, J. M. (2007). Vagally mediated heart rate variability and heart rate entropy as predictors of treatment outcome in flight phobia. <em>Biological Psychology</em>. <a href="https://doi.org/10.1016/j.biopsycho.2007.07.007" target="_blank" rel="noopener noreferrer" class="text-sky-600 hover:underline">https://doi.org/10.1016/j.biopsycho.2007.07.007</a>',
    },
    {
      key: 'bornas2007flying',
      htmlContent: 'Bornas, X., & Llabrés, J. (2007). Tratamiento del miedo a volar con exposición asistida por ordenador Computer-Assisted fear of flying treatment. <em>Flying</em>, 21–34.',
    },
    {
      key: 'tortella2011bm',
      htmlContent: 'Tortella-Feliu, M., Botella, C., Llabrés, J., Bretón-López, J. M., del Amo, A. R., Baños, R. M., & Gelabert, J. M. (2011). Virtual Reality Versus Computer-Aided Exposure Treatments for Fear of Flying. <em>Behavior Modification, 35</em>(1), 3–30. <a href="https://doi.org/10.1177/0145445510390801" target="_blank" rel="noopener noreferrer" class="text-sky-600 hover:underline">https://doi.org/10.1177/0145445510390801</a>',
    },
    {
      key: 'bornas2012apb',
      htmlContent: 'Bornas, X., Del Amo, A. R., Tortella-Feliu, M., & Llabrés, J. (2012). Heart rate variability profiles and exposure therapy treatment outcome in flight phobia. <em>Applied Psychophysiology Biofeedback, 37</em>(1), 53–62. <a href="https://doi.org/10.1007/s10484-011-9179-5" target="_blank" rel="noopener noreferrer" class="text-sky-600 hover:underline">https://doi.org/10.1007/s10484-011-9179-5</a>',
    },
    {
      key: 'breton2015bp',
      htmlContent: 'Bretón-López, J., Tortella-Feliu, M., Del Amo, A. R., Baños, R., Llabrés, J., Gelabert, J. M., & Botella, C. (2015). Patients’ preferences regarding three computerbased exposure treatments for fear of flying. <em>Behavioral Psychology/ Psicologia Conductual</em>.',
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageTitle title={t('scientificFoundation.title')} />
      <SectionCard>
        <p className="mb-6 text-gray-700 leading-relaxed">
          {t('scientificFoundation.introduction')}
        </p>
      </SectionCard>
      <SectionCard title={t('scientificFoundation.referencesTitle')}>
        <ul className="grid gap-4 list-none p-0">
          {references.sort((a,b) => a.key.localeCompare(b.key)).map(ref => (
            <li 
              key={ref.key} 
              className="rounded-xl shadow-sm border-l-4 border-sky-500 bg-white p-4 text-sm text-gray-800 leading-normal"
              dangerouslySetInnerHTML={{ __html: ref.htmlContent }} 
            />
          ))}
        </ul>
      </SectionCard>
    </div>
  );
};