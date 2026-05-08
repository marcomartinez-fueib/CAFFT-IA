
import React, { useState } from 'react';
import { seedSimulatedPatients } from '../../utils/seedDevData';
import { deleteAllUserData } from '../../utils/localStorageDB';

const BrainIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 0 1-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 1 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 1 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 1-3.09 3.09ZM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.898 20.572L16.25 21l-.648-.428a2.25 2.25 0 0 1-1.47-2.185l.245-1.559a2.25 2.25 0 0 1 1.47-2.185l.648-.428.648.428a2.25 2.25 0 0 1 1.47 2.185l-.245 1.559a2.25 2.25 0 0 1-1.47 2.185Z" />
    </svg>
);


export const DevToolsPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSeedData = async () => {
        setLoading(true);
        setMessage('Clearing existing data...');
        await new Promise(res => setTimeout(res, 500)); // give time for message to render
        deleteAllUserData();
        
        setMessage('Seeding 5 simulated patients...');
        await new Promise(res => setTimeout(res, 500));
        try {
            await seedSimulatedPatients();
            setMessage(`Seeding complete! Hierarchy created:
- Superadmin: admin / clauacces
- Manager: gestor / clauacces
- Therapist: terapeuta / clauacces
Patients created for terapeuta: Anna, Marc, Carla, Pau, Laura.`);
        } catch (e) {
            console.error(e);
            setMessage(`An error occurred during seeding: ${e instanceof Error ? e.message : String(e)}`);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <div className="text-center max-w-2xl">
                <BrainIcon className="w-16 h-16 mx-auto text-sky-400 mb-4" />
                <h1 className="text-4xl font-bold mb-2">CAFFT Developer Tools</h1>
                <p className="text-gray-400 mb-8">This page is for development and demonstration purposes only.</p>

                <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 shadow-xl">
                    <h2 className="text-2xl font-semibold mb-3 text-sky-300">Seed Simulated Patient Data</h2>
                    <p className="text-sm text-gray-400 mb-6">
                        Clicking this button will <strong className="text-amber-400">delete all existing user data</strong> from local storage and create 5 new simulated patient profiles based on the clinical archetypes described in the research PDF.
                    </p>
                    <button
                        onClick={handleSeedData}
                        disabled={loading}
                        className="w-full px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-500 disabled:bg-gray-500 disabled:cursor-wait transition-all duration-200 ease-in-out"
                    >
                        {loading ? 'Processing...' : 'Clear & Seed Data'}
                    </button>
                    {message && (
                        <p className="mt-6 text-sm text-green-300 bg-green-900/50 p-3 rounded-md border border-green-700">
                            {message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
