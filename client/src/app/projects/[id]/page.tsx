"use client"

import { useState } from 'react'
import ProjectHeader from '@/app/projects/ProjectHeader';
import BoardView from '../BoardView';
import { useParams } from 'next/navigation';

// type Props = { params: { id: string } }

const Project = () => {
    const params = useParams();
    const id = typeof params?.id === "string" ? params.id : "";
    const [activeTab, setActiveTab] = useState("Board");
    const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);

    return (
        <div>
            <ProjectHeader activeTab={activeTab} setActiveTab={setActiveTab} />
            {activeTab === "Board" && (
                <BoardView id={id} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />
            )}
        </div>
    )
}

export default Project