
import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';

interface ExpandableTextProps {
    text: string;
    maxLength?: number;
}

export const ExpandableText: React.FC<ExpandableTextProps> = ({ text, maxLength = 180 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { t } = useLanguage();

    if (!text) return null;
    if (text.length <= maxLength) return <div className="leading-relaxed whitespace-pre-wrap">{text}</div>;

    return (
        <div className="leading-relaxed whitespace-pre-wrap">
            {isExpanded ? text : `${text.substring(0, maxLength)}...`}
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="ml-2 text-uib-blue font-bold hover:underline focus:outline-none inline-flex items-center"
            >
                {isExpanded ? t('general.seeLess') : t('general.seeMore')}
            </button>
        </div>
    );
};
