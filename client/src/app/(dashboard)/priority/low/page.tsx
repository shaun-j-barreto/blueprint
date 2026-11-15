import ReusablePage from '../reusablePage'
import { Priority } from '@/state/api'

const Low = () => {
    return (
        <ReusablePage priority={Priority.Low} />
    )
}

export default Low