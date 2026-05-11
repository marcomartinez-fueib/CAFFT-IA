
import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { 
  BookOpen, 
  Target, 
  Wind, 
  Layout, 
  Stethoscope, 
  AlertTriangle, 
  CheckCircle2,
  ListChecks,
  Activity,
  Milestone
} from 'lucide-react';
import { motion } from 'motion/react';

export const ClinicalGuidePage: React.FC = () => {
    const { t } = useLanguage();

    const sections = [
        {
            title: t('helpModal.therapistInfo.principlesTitle') || "Fonament de la Tècnica d'Exposició",
            icon: <Activity className="w-6 h-6 text-uib-blue" />,
            content: (
                <div className="space-y-4">
                    <p className="text-slate-600 leading-relaxed">
                        Les tècniques d'exposició consisteixen en la planificació de confrontacions repetides i perllongades als estímuls evocadors de la por fòbica, fins que aquesta remeti, prevenint l'aparició de conductes de fugida o evitació.
                    </p>
                    <div className="bg-blue-50 border-l-4 border-uib-blue p-4 rounded-r-xl">
                        <h4 className="font-black text-xs uppercase tracking-widest text-uib-blue mb-2">Principis</h4>
                        <ul className="list-disc list-inside text-slate-700 text-sm space-y-1">
                            {(() => {
                                const list = t('helpModal.therapistInfo.principlesList', { returnObjects: true });
                                const finalList = Array.isArray(list) ? list : [
                                    "Habituació de les respostes emocionals condicionades.",
                                    "Extinció de les respostes emocionals condicionades.",
                                    "Aprenentatge d'estratègies d'afrontament incompatibles amb la fugida i l'evitació."
                                ];
                                return finalList.map((principle, idx) => (
                                    <li key={`principle-${idx}`}>
                                        {typeof principle === 'string' ? principle : String(principle)}
                                    </li>
                                ));
                            })()}
                        </ul>
                    </div>
                </div>
            )
        },
        {
            title: t('helpModal.therapistInfo.objectivesTitle') || "Objectius del Tractament",
            icon: <Target className="w-6 h-6 text-rose-500" />,
            content: (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(() => {
                        const list = t('helpModal.therapistInfo.objectivesList', { returnObjects: true });
                        const finalList = Array.isArray(list) ? list : [
                            { title: "Fisiològics", desc: "Habituació de les respostes del sistema nerviós autònom." },
                            { title: "Motors", desc: "Extinció de les conductes d'evitació i fugida." },
                            { title: "Cognitius", desc: "Optimització de l'aprenentatge inhibitori i desmentiment de pors." }
                        ];
                        return finalList.map((item: any, i: number) => (
                            <div key={`objective-${i}`} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <h5 className="font-bold text-slate-800 mb-1">
                                    {typeof item === 'object' ? item.title : String(item)}
                                </h5>
                                {typeof item === 'object' && item.desc && (
                                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                                )}
                            </div>
                        ));
                    })()}
                </div>
            )
        },
        {
            title: t('helpModal.therapistInfo.procedureTitle') || "Procediment d'Aplicació",
            icon: <Layout className="w-6 h-6 text-amber-500" />,
            content: (
                <div className="space-y-6">
                    <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                        {(() => {
                            const list = t('helpModal.therapistInfo.procedureSteps', { returnObjects: true });
                            const finalList = Array.isArray(list) ? list : [
                                { step: "1", title: "Conceptualització", desc: "Explicació del procés terapèutic." },
                                { step: "2", title: "Jerarquia", desc: "Identificació d'estímuls." },
                                { step: "3", title: "Presentació", desc: "Exposició gradual." },
                                { step: "4", title: "Pràctica", desc: "Generalització." }
                            ];
                            return finalList.map((item: any, i: number) => (
                                <div key={`step-${i}`} className="relative">
                                    <div className="absolute -left-8 w-6 h-6 bg-white border-2 border-amber-500 rounded-full flex items-center justify-center text-[10px] font-black text-amber-500 z-10">
                                        {typeof item === 'object' ? item.step : (i + 1)}
                                    </div>
                                    <h5 className="font-bold text-slate-800 mb-1">
                                        {typeof item === 'object' ? item.title : String(item)}
                                    </h5>
                                    {typeof item === 'object' && item.desc && (
                                        <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                                    )}
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            )
        },
        {
            title: t('helpModal.therapistInfo.feedbackTitle') || "Pautes per a un Feedback Efectiu",
            icon: <ListChecks className="w-6 h-6 text-purple-500" />,
            content: (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-5 rounded-2xl">
                        <h5 className="font-bold text-slate-700 mb-3 flex items-center">
                            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
                            {t('helpModal.therapistInfo.feedbackImmediateTitle') || "Immediat"}
                        </h5>
                        <ul className="text-xs text-slate-600 space-y-2">
                            {(() => {
                                const list = t('helpModal.therapistInfo.feedbackImmediateList', { returnObjects: true });
                                const finalList = Array.isArray(list) ? list : [];
                                return finalList.map((point, idx) => (
                                    <li key={`immediate-${idx}`} className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 shrink-0" />
                                        {typeof point === 'string' ? point : String(point)}
                                    </li>
                                ));
                            })()}
                        </ul>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl">
                        <h5 className="font-bold text-slate-700 mb-3 flex items-center">
                            <Milestone className="w-4 h-4 mr-2 text-uib-blue" />
                            {t('helpModal.therapistInfo.feedbackMaintenanceTitle') || "Manteniment"}
                        </h5>
                        <ul className="text-xs text-slate-600 space-y-2">
                            {(() => {
                                const list = t('helpModal.therapistInfo.feedbackMaintenanceList', { returnObjects: true });
                                const finalList = Array.isArray(list) ? list : [];
                                return finalList.map((point, idx) => (
                                    <li key={`maintenance-${idx}`} className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 bg-uib-blue/40 rounded-full mt-1.5 shrink-0" />
                                        {typeof point === 'string' ? point : String(point)}
                                    </li>
                                ));
                            })()}
                        </ul>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-uib-blue/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-uib-blue/10 p-3 rounded-2xl text-uib-blue">
                             <BookOpen className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-[10px] font-black text-uib-blue uppercase tracking-[0.3em]">Protocol Clínic</h2>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Guia d'Aplicació</h1>
                        </div>
                    </div>
                    <p className="text-slate-500 max-w-xl leading-relaxed">
                        Aquesta secció conté les directrius oficials per al terapeuta segons el manual CAFFT, la fonamentació en tècniques d'exposició conductual i les aportacions de Michelle Craske (Inhibitory Learning).
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-8">
                {sections.map((section, index) => (
                    <motion.section 
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-uib-blue/20 transition-all group"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-uib-blue/5 transition-colors">
                                {section.icon}
                            </div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight italic">
                                {section.title}
                            </h3>
                        </div>
                        {section.content}
                    </motion.section>
                ))}
            </div>

            <footer className="bg-slate-900 p-10 rounded-[2.5rem] text-white overflow-hidden relative">
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-uib-blue/20 rounded-full -mb-48 -mr-48 blur-3xl opacity-50" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-xl">
                        <Stethoscope className="w-12 h-12 text-uib-accent" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <h4 className="text-2xl font-black italic tracking-tight text-white">{t('helpModal.therapistInfo.successMessage') || "L'èxit de l'exposició depèn de la implicació."}</h4>
                        <p className="text-white text-sm leading-relaxed max-w-2xl opacity-90">
                            {t('helpModal.therapistInfo.successDesc') || "Recordi que el CAFFT és una eina de suport. La seva tasca com a professional és supervisar que el pacient s'impliqui emocionalment en l'escenari sense utilitzar mecanismes de defensa que evitin el processament emocional necessari per a l'habituació."}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
