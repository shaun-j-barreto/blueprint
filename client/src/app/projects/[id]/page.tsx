"use client"

import { useState } from 'react'
import ProjectHeader from '@/app/projects/ProjectHeader';
import BoardView from '../BoardView';
import { useParams } from 'next/navigation';
import ListView from '../ListView';
import TimelineView from '../TimelineView';
import TableView from '../TableView';
import ModalNewTask from '@/components/ModalNewTask';

// type Props = { params: { id: string } }

const Project = () => {
    const params = useParams();
    const id = typeof params?.id === "string" ? params.id : "";
    const [activeTab, setActiveTab] = useState("Board");
    const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);

    return (
        <div>
            <ModalNewTask isOpen={isModalNewTaskOpen} onClose={() => setIsModalNewTaskOpen(false)} id={id} />
            <ProjectHeader activeTab={activeTab} setActiveTab={setActiveTab} />
            {activeTab === "Board" && (
                <BoardView id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />
            )}
            {activeTab === "List" && (
                <ListView id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />
            )}
            {activeTab === "Timeline" && (
                <TimelineView id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />
            )}
            {activeTab === "Table" && (
                <TableView id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />
            )}
        </div>
    )
}

export default Project