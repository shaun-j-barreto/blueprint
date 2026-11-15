import ReusablePage from '../reusablePage'
import { Priority } from '@/state/api'

const Urgent = () => {
    return (
        <ReusablePage priority={Priority.Urgent} />
    )
}

export default Urgent