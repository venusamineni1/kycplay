import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { questionnaireService } from '../services/questionnaireService';
import Button from '../components/Button';

const Questionnaire = () => {
    const { id: caseId } = useParams();
    const [template, setTemplate] = useState([]);
    const [responses, setResponses] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [temp, resp] = await Promise.all([
                    questionnaireService.getTemplate(),
                    questionnaireService.getResponses(caseId)
                ]);
                setTemplate(temp);

                // Convert responses list to a map for easy lookup
                const respMap = {};
                resp.forEach(r => {
                    respMap[r.questionID] = r.answerText;
                });
                setResponses(respMap);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [caseId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = Object.keys(responses).map(qId => ({
                questionID: parseInt(qId),
                answerText: responses[qId]
            }));
            await questionnaireService.saveResponses(caseId, payload);
            alert('Questionnaire saved successfully');
        } catch (err) {
            alert('Save failed: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleMultiChoice = (questionId, option) => {
        const currentVal = responses[questionId] || '';
        let selected = currentVal ? currentVal.split(',') : [];
        if (selected.includes(option)) {
            selected = selected.filter(s => s !== option);
        } else {
            selected.push(option);
        }
        setResponses({ ...responses, [questionId]: selected.join(',') });
    };

    if (loading) return <p className="loading">Loading questionnaire...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>KYC Questionnaire</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Link to={`/cases/${caseId}`} className="back-link">Back to Case</Link>
                </div>
            </header>

            {template.map(section => (
                <section key={section.sectionID} className="glass-section" style={{ marginBottom: '1.5rem' }}>
                    <h3>{section.sectionName}</h3>
                    {section.questions.map(q => (
                        <div key={q.questionID} style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                {q.questionText}
                                {q.isMandatory && <span style={{ color: '#ff6b6b', marginLeft: '0.25rem' }}>*</span>}
                            </label>
                            {q.questionType === 'TEXT' ? (
                                <textarea
                                    value={responses[q.questionID] || ''}
                                    onChange={(e) => setResponses({ ...responses, [q.questionID]: e.target.value })}
                                    style={{ width: '100%', height: '80px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '4px', padding: '0.5rem' }}
                                />
                            ) : q.questionType === 'CHOICE' ? (
                                <select
                                    value={responses[q.questionID] || ''}
                                    onChange={(e) => setResponses({ ...responses, [q.questionID]: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '4px' }}
                                >
                                    <option value="">Select an option...</option>
                                    {q.options.split(';').map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            ) : q.questionType === 'YES_NO' ? (
                                <div style={{ display: 'flex', gap: '1.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name={`q_${q.questionID}`}
                                            value="Yes"
                                            checked={responses[q.questionID] === 'Yes'}
                                            onChange={(e) => setResponses({ ...responses, [q.questionID]: e.target.value })}
                                        />
                                        Yes
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name={`q_${q.questionID}`}
                                            value="No"
                                            checked={responses[q.questionID] === 'No'}
                                            onChange={(e) => setResponses({ ...responses, [q.questionID]: e.target.value })}
                                        />
                                        No
                                    </label>
                                </div>
                            ) : q.questionType === 'MULTI_CHOICE' ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                    {q.options.split(',').map(opt => (
                                        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px' }}>
                                            <input
                                                type="checkbox"
                                                value={opt}
                                                checked={(responses[q.questionID] || '').split(',').includes(opt)}
                                                onChange={() => toggleMultiChoice(q.questionID, opt)}
                                            />
                                            {opt}
                                        </label>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    ))}
                </section>
            ))}
        </div>
    );
};

export default Questionnaire;
