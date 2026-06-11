import ReusablePage from '../reusablePage'
import { Priority } from '@/state/api'

const High = () => {
    return (
        <ReusablePage priority={Priority.High} />
    )
}

export default High