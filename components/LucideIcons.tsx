import { icons } from 'lucide-react-native';

import { LucideProps } from 'lucide-react-native';

interface IconProps extends LucideProps {
    name: string;
}

const Icon = ({ name, ...props }: IconProps) => {
    const LucideIcon = icons[name as keyof typeof icons] || icons.Info; // Fallback
    return <LucideIcon {...props} />;
};

export default Icon;
