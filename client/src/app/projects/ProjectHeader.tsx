import React from 'react'

type Props = {
    activeTab: string;
    setActiveTab: (tabName: string) => void
}

const ProjectHeader = ({ activeTab, setActiveTab }: Props) => {
    return (
        <div>ProjectHeader</div>
    )
}

export default ProjectHeader