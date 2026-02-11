import React, { useEffect, useState } from 'react';
import { CreateJournalModal } from '../components/accounting/CreateJournalModal';
import { JournalList } from '../components/accounting/JournalList';
import { TrialBalanceTable } from '../components/accounting/TrialBalanceTable';
import { BudgetExecutionReport } from '../components/accounting/BudgetExecutionReport';
import { ThirdPartyLedger } from '../components/accounting/ThirdPartyLedger';
import api from '../api/client';
import type { JournalEntry, Account, TrialBalanceItem } from '../types';
import { cn } from '../lib/utils';
import { BookOpen, FileBarChart, Plus, Users } from 'lucide-react';

type Tab = 'JOURNAL' | 'REPORTS' | 'BUDGET' | 'LEDGER';

export const AccountingPage = () => {
    const [activeTab, setActiveTab] = useState<Tab>('JOURNAL');
    const [loading, setLoading] = useState(false);
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [reportData, setReportData] = useState<TrialBalanceItem[]>([]);

    // Modal State
    const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);

    const fetchJournal = async () => {
        setLoading(true);
        try {
            const res = await api.get('/accounting/entries');
            setEntries(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/settings/accounts');
            setAccounts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get('/accounting/trial-balance');
            setReportData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'JOURNAL') {
            fetchJournal();
            if (accounts.length === 0) fetchAccounts();
        }
        if (activeTab === 'REPORTS') {
            fetchReport();
        }
    }, [activeTab]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Contabilidad</h2>
                    <p className="text-muted-foreground">Registro cronológico y reportes financieros.</p>
                </div>
                {activeTab === 'JOURNAL' && (
                    <button
                        onClick={() => setIsJournalModalOpen(true)}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Asiento
                    </button>
                )}
            </div>

            <div className="flex space-x-1 border-b overflow-x-auto pb-1">
                <TabButton active={activeTab === 'JOURNAL'} onClick={() => setActiveTab('JOURNAL')} icon={<BookOpen className="w-4 h-4" />} label="Libro Diario" />
                <TabButton active={activeTab === 'LEDGER'} onClick={() => setActiveTab('LEDGER')} icon={<Users className="w-4 h-4" />} label="Libro Mayor (Terceros)" />
                <TabButton active={activeTab === 'REPORTS'} onClick={() => setActiveTab('REPORTS')} icon={<FileBarChart className="w-4 h-4" />} label="Balance Contable" />
                <TabButton active={activeTab === 'BUDGET'} onClick={() => setActiveTab('BUDGET')} icon={<FileBarChart className="w-4 h-4" />} label="Presupuesto" />
            </div>

            <div className="min-h-[400px]">
                {loading && activeTab === 'JOURNAL' ? (
                    <div className="p-8 text-center text-muted-foreground">Cargando datos...</div>
                ) : (
                    <>
                        {activeTab === 'JOURNAL' && <JournalList entries={entries} />}
                        {activeTab === 'LEDGER' && <ThirdPartyLedger />}
                        {activeTab === 'REPORTS' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Balance de Comprobación</h3>
                                <TrialBalanceTable data={reportData} />
                            </div>
                        )}
                        {activeTab === 'BUDGET' && <BudgetExecutionReport />}
                    </>
                )}
            </div>

            <CreateJournalModal
                isOpen={isJournalModalOpen}
                onClose={() => setIsJournalModalOpen(false)}
                onSuccess={fetchJournal}
                accounts={accounts}
            />
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
            active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
        )}
    >
        {icon}
        {label}
    </button>
);
