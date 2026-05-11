
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { PageTitle } from '../../components/PageTitle';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { FileText, ExternalLink, Quote, Beaker, Zap, BarChart3, HelpCircle } from 'lucide-react';

export const ScientificEvidencePage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const references = [
    {
      authors: "Bornas, X. y Tortella-F. M.",
      year: 1995,
      title: "Descripción y análisis psicométrico de un instrumento de autoinforme para la evaluación del miedo a volar.",
      journal: "Psicología Conductual",
      volume: "3",
      issue: "1",
      pages: "67–86",
      url: ""
    },
    {
      authors: "Bornas, X. et al.",
      year: 1999,
      title: "Validacion Factorial Del Cuestionario De Miedo a Volar.",
      journal: "Analisis y Modificación de Conducta",
      volume: "25",
      issue: "104",
      pages: "885–907",
      url: ""
    },
    {
      authors: "Bornas, X., Fullana, M. A., Tortella-Feliu, M., Llabrés, J., & De La Banda, G. G.",
      year: 2001,
      title: "Computer-assisted therapy in the treatment of flight phobia: A case report.",
      journal: "Cognitive and Behavioral Practice",
      volume: "8",
      issue: "3",
      pages: "234–240",
      doi: "10.1016/S1077-7229(01)80058-4",
      url: "https://doi.org/10.1016/S1077-7229(01)80058-4"
    },
    {
      authors: "Bornas, X.",
      year: 2001,
      title: "Computer-Assisted Exposure Treatment for Flight Phobia: a Controlled Study.",
      journal: "Psychotherapy Research",
      volume: "11",
      issue: "3",
      pages: "259–273",
      doi: "10.1093/ptr/11.3.259",
      url: "https://doi.org/10.1093/ptr/11.3.259"
    },
    {
      authors: "Bornas, X., Tortella-Feliu, M., Llabrés, J., Mühlberger, A., Pauli, P., & Barceló, F.",
      year: 2002,
      title: "Clinical usefulness of a simulated exposure treatment for fear of flying.",
      journal: "Int J Clin Health Psychol",
      volume: "2",
      issue: "2",
      pages: "247-262",
      url: "http://www.aepc.es/ijchp/articulos_pdf/ijchp-38.pdf"
    },
    {
      authors: "Bornas, X., Llabrés, J., Noguera, M., López, A. M., Barceló, F., Tortella-Feliu, M., & Fullana, M. A.",
      year: 2004,
      title: "Self-implication and heart rate variability during simulated exposure to flight-related stimuli.",
      journal: "Anxiety, Stress, and Coping",
      volume: "17",
      issue: "4",
      pages: "331-339",
      doi: "10.1080/10615800512331328777",
      url: "https://doi.org/10.1080/10615800512331328777"
    },
    {
      authors: "Bornas, X., Tortella-Feliu, M., & Llabrés, J.",
      year: 2006,
      title: "Do all treatments work for flight phobia? Computer-assisted exposure versus a brief multicomponent nonexposure treatment.",
      journal: "Psychotherapy Research",
      volume: "16",
      issue: "1",
      pages: "41-50",
      doi: "10.1080/10503300500091058",
      url: "https://doi.org/10.1080/10503300500091058"
    },
    {
      authors: "Bornas, X., & Llabrés, J.",
      year: 2007,
      title: "Tratamiento del miedo a volar con exposición asistida por ordenador Computer-Assisted fear of flying treatment.",
      journal: "Flying",
      volume: "3",
      pages: "21–34",
      url: "https://sites.google.com/site/unitatdinarem/serveis/revisioCAFFT.pdf"
    },
    {
      authors: "Bornas, X., Llabrés, J., Tortella-Feliu, M., Fullana, M. A., Montoya, P., López, A., … Gelabert, J. M.",
      year: 2007,
      title: "Vagally mediated heart rate variability and heart rate entropy as predictors of treatment outcome in flight phobia.",
      journal: "Biological Psychology",
      volume: "76",
      issue: "3",
      pages: "188-195",
      doi: "10.1016/j.biopsycho.2007.07.007",
      url: "https://doi.org/10.1016/j.biopsycho.2007.07.007"
    },
    {
        authors: "Bornas, X., Gelabert, J. M., Llabrés, J., Balle, M., & Tortella-Feliu, M.",
        year: 2011,
        title: "Slope of change throughout exposure treatment for flight phobia: the role of autonomic flexibility.",
        journal: "Journal of Clinical Psychology",
        volume: "67",
        issue: "6",
        pages: "550–560",
        doi: "10.1002/jclp.20780",
        url: "https://doi.org/10.1002/jclp.20780"
    },
    {
      authors: "Tortella-Feliu, M., Botella, C., Llabrés, J., Bretón-López, J., Riera del Amo, A., Baños, R. M., & Gelabert, J. M.",
      year: 2011,
      title: "Virtual reality versus computer-aided exposure treatments for fear of flying.",
      journal: "Behavior Modification",
      volume: "35",
      issue: "1",
      pages: "3–30",
      doi: "10.1177/0145445510390801",
      url: "https://doi.org/10.1177/0145445510390801"
    },
    {
        authors: "Bornas, X., Riera del Amo, A., Tortella-Feliu, M., & Llabrés, J.",
        year: 2012,
        title: "Heart rate variability profiles and exposure therapy treatment outcome in flight phobia.",
        journal: "Applied Psychophysiology and Biofeedback",
        volume: "37",
        issue: "1",
        pages: "53–62",
        doi: "10.1007/s10484-011-9179-5",
        url: "https://doi.org/10.1007/s10484-011-9179-5"
    },
    {
      authors: "Craske, M. G., Treanor, M., Conway, C. C., Zbozinek, T., & Vervliet, B.",
      year: 2014,
      title: "Maximizing exposure therapy: An inhibitory learning approach.",
      journal: "Behaviour Research and Therapy",
      volume: "58",
      pages: "10–23",
      doi: "10.1016/j.brat.2014.04.006",
      url: "https://doi.org/10.1016/j.brat.2014.04.006"
    },
    {
      authors: "Bretón-López, J., Tortella-Feliu, M., Riera del Amo, A., Baños, R., Llabrés, J., Gelabert, J. M., & Botella, C.",
      year: 2015,
      title: "Patients’ preferences regarding three computer-based exposure treatments for fear of flying.",
      journal: "Behavioral Psychology / Psicología Conductual",
      volume: "23",
      issue: "2",
      pages: "265-285",
      url: "https://www.behavioralpsycho.com/wp-content/uploads/2019/08/04.Breton_23-2.pdf"
    }
  ];

  return (
    <div className="max-w-[1920px] mx-auto">
      <Breadcrumbs items={[{ label: t('nav.therapistDashboard'), path: '/therapist/dashboard' }, { label: t('nav.scientificEvidence') }]} />
      <PageTitle title={t('nav.scientificEvidence')} />
      
      <div className="mt-8 space-y-12">
        {/* Foundation & Evidence Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-200 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute -top-10 -right-10 opacity-[0.03]">
                    <Beaker className="w-64 h-64 text-uib-blue" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-black text-uib-blue uppercase tracking-[0.2em] mb-8 flex items-center">
                        <Beaker className="w-8 h-8 mr-4 text-uib-accent" />
                        {t('helpModal.therapistInfo.evidenceTitle')}
                    </h3>
                    <div className="space-y-4 text-slate-600 text-base leading-relaxed">
                        <ReactMarkdown 
                            components={{
                                p: ({node, ...props}) => <p className="mb-4 text-slate-600" {...props} />,
                                strong: ({node, ...props}) => <strong className="text-uib-blue font-black" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-3" {...props} />,
                                li: ({node, ...props}) => <li className="text-slate-600" {...props} />,
                            }}
                        >
                            {t('helpModal.therapistInfo.evidenceText')}
                        </ReactMarkdown>
                    </div>
                </div>
                <div className="mt-10 pt-6 border-t border-slate-100 flex items-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                    <Zap className="w-4 h-4 mr-2 text-uib-accent" />
                    Basat en la darrera evidència científica (UIB)
                </div>
            </div>

            <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-200 shadow-xl relative overflow-hidden">
                <div className="absolute -bottom-10 -right-10 opacity-[0.03]">
                    <BarChart3 className="w-64 h-64 text-uib-blue" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-black text-uib-blue uppercase tracking-[0.2em] mb-8 flex items-center">
                        <BarChart3 className="w-8 h-8 mr-4 text-uib-accent" />
                        {t('helpModal.therapistInfo.metricsTitle')}
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 hover:bg-slate-100 transition-colors">
                            <p className="text-sm font-black text-uib-blue uppercase tracking-widest mb-3 flex items-center">
                                <span className="w-2.5 h-2.5 bg-uib-accent rounded-full mr-3 shadow-lg shadow-uib-accent/40"></span>
                                {t('helpModal.therapistInfo.rciTitle') || 'Reliable Change Index (RCI)'}
                            </p>
                            <div className="text-slate-700 text-[15px] leading-relaxed prose prose-slate max-w-none font-medium">
                                <ReactMarkdown>{t('helpModal.therapistInfo.rciExplanation')}</ReactMarkdown>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 hover:bg-slate-100 transition-colors">
                            <p className="text-sm font-black text-uib-blue uppercase tracking-widest mb-3 flex items-center">
                                <span className="w-2.5 h-2.5 bg-uib-accent rounded-full mr-3 shadow-lg shadow-uib-accent/40"></span>
                                {t('helpModal.therapistInfo.slopeTitle') || 'Habituation Slope'}
                            </p>
                            <div className="text-slate-700 text-[15px] leading-relaxed prose prose-slate max-w-none font-medium">
                                <ReactMarkdown>{t('helpModal.therapistInfo.slopeExplanation')}</ReactMarkdown>
                            </div>
                        </div>
                        <div className="p-6 bg-sky-50 rounded-3xl border border-sky-200/50 hover:bg-sky-100/50 transition-colors">
                            <p className="text-sm font-black text-uib-blue uppercase tracking-widest mb-3 flex items-center">
                                <span className="w-2.5 h-2.5 bg-uib-accent rounded-full mr-3 shadow-lg shadow-uib-accent/40"></span>
                                {t('helpModal.therapistInfo.mechanismTitle')}
                            </p>
                            <div className="text-slate-700 text-[15px] leading-relaxed prose prose-sky max-w-none font-medium">
                                <ReactMarkdown>{t('helpModal.therapistInfo.mechanismText')}</ReactMarkdown>
                            </div>
                        </div>

                        {/* Inhibitory Learning Section */}
                        <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 hover:bg-emerald-50 transition-colors">
                            <p className="text-sm font-black text-emerald-700 uppercase tracking-widest mb-3 flex items-center">
                                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full mr-3 shadow-lg shadow-emerald-400/40"></span>
                                {t('helpModal.therapistInfo.inhibitoryTitle') || 'Inhibitory Learning (Craske)'}
                            </p>
                            <div className="text-slate-700 text-[15px] leading-relaxed prose prose-slate max-w-none font-medium">
                                <ReactMarkdown>{t('helpModal.therapistInfo.inhibitoryText')}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* References Section */}
        <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center px-4">
                <FileText className="w-4 h-4 mr-2" />
                {t('scientificFoundation.referencesTitle')}
            </h3>
            <div className="grid grid-cols-1 gap-4">
            {references.map((ref, index) => (
                <div key={index} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-uib-blue/30 transition-all group font-sans relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-100 group-hover:bg-uib-blue transition-colors" />
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-5">
                    <div className="mt-1 bg-slate-50 p-2.5 rounded-xl text-slate-300 group-hover:bg-sky-50 group-hover:text-uib-blue transition-colors shadow-inner">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-2.5">
                        <p className="text-[15px] text-slate-700 font-medium leading-relaxed">
                          <span className="font-bold text-slate-900">{ref.authors}</span> ({ref.year}). {ref.title} <span className="italic text-uib-blue/80">{ref.journal}</span>, <span className="italic font-bold text-uib-blue">{ref.volume}</span>{ref.issue ? `(${ref.issue})` : ''}, {ref.pages}.
                        </p>
                        <div className="flex items-center gap-4">
                            {ref.doi && (
                                <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase px-2 py-0.5 bg-slate-50 rounded border border-slate-100">DOI: {ref.doi}</p>
                            )}
                            {ref.url && (
                                <a 
                                    href={ref.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-black text-uib-blue/60 hover:text-uib-blue uppercase tracking-widest flex items-center transition-colors"
                                >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    {t('common.viewSource') || 'View Article'}
                                </a>
                            )}
                        </div>
                    </div>
                    </div>
                </div>
                </div>
            ))}
            </div>
        </div>

        {/* Clinical Application Footer */}
        <div className="bg-slate-900 text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Zap className="w-48 h-48" />
             </div>
             <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="bg-uib-accent p-5 rounded-3xl text-uib-blue shrink-0 shadow-xl shadow-uib-accent/20">
                    <HelpCircle className="w-10 h-10" />
                </div>
                <div className="flex-1 space-y-4">
                    <h3 className="text-2xl font-black uppercase tracking-widest text-white">{t('helpModal.therapistInfo.applicationTitle')}</h3>
                    <p className="text-white text-base leading-relaxed max-w-3xl opacity-90">
                        {t('helpModal.therapistInfo.applicationSummary') || "Disposem d'una guia detallada per a l'aplicació clínica del protocol CAFFT, amb instruccions sobre l'exposició, el feedback i les tècniques de regulació."}
                    </p>
                    <button 
                        onClick={() => navigate('/therapist/guide')}
                        className="bg-white text-uib-blue font-black px-8 py-4 rounded-2xl hover:bg-uib-accent transition-all transform hover:scale-105 shadow-xl flex items-center"
                    >
                        <Zap className="w-5 h-5 mr-3" />
                         ANAR A LA GUIA CLÍNICA
                    </button>
                </div>
             </div>
        </div>


      </div>
    </div>
  );
};

