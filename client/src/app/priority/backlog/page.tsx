import ReusablePage from '../reusablePage'
import { Priority } from '@/state/api'

const Backlog = () => {
    return (
        <ReusablePage priority={Priority.Backlog} />
    )
}

export default Backlog