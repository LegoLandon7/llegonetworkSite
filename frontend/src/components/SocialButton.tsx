import type { ReactNode } from 'react';
import { FaGithub, FaTwitter, FaLinkedin, FaFacebook, FaInstagram, FaYoutube, FaDiscord, FaTwitch, FaTiktok, FaReddit } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import './SocialButton.scss';

type SocialType = 'default' | 'github' | 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'youtube' | 'discord' | 'twitch' | 'tiktok' | 'reddit' | 'email';

export const socialIcons: Record<SocialType, ReactNode> = {
    default: <MdEmail />,
    github: <FaGithub />,
    twitter: <FaTwitter />,
    linkedin: <FaLinkedin />,
    facebook: <FaFacebook />,
    instagram: <FaInstagram />,
    youtube: <FaYoutube />,
    discord: <FaDiscord />,
    twitch: <FaTwitch />,
    tiktok: <FaTiktok />,
    reddit: <FaReddit />,
    email: <MdEmail />
};

const socialGradients: Record<SocialType, string> = {
    default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    github: 'linear-gradient(135deg, #1f1f1f 0%, #3f3f3f 100%)',
    twitter: 'linear-gradient(135deg, #1DA1F2 0%, #1a91da 100%)',
    linkedin: 'linear-gradient(135deg, #0A66C2 0%, #005a9c 100%)',
    facebook: 'linear-gradient(135deg, #1877F2 0%, #0a66c2 100%)',
    instagram: 'linear-gradient(135deg, #FD1D1D 0%, #833AB4 50%, #FD1D1D 100%)',
    youtube: 'linear-gradient(135deg, #FF0000 0%, #cc0000 100%)',
    discord: 'linear-gradient(135deg, #5865F2 0%, #404ce5 100%)',
    twitch: 'linear-gradient(135deg, #9146FF 0%, #6c2ed5 100%)',
    tiktok: 'linear-gradient(135deg, #25F4EE 0%, #FE2C55 100%)',
    reddit: 'linear-gradient(135deg, #FF4500 0%, #d63900 100%)',
    email: 'linear-gradient(135deg, #EA4335 0%, #c5221f 100%)'
};

export function SocialButton({
    social = 'default',
    link = '/',
    username = 'username'
}: {
    social?: SocialType
    link?: string
    username?: string
}) {
    const icon = socialIcons[social];
    const gradient = socialGradients[social];

    return (
        <a 
            href={link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className='social-button'
            style={{ background: gradient }}
        >
            {icon}
            {username}
        </a>
    );
}

export default function SocialButtonWrapper({ 
    socials 
}: { 
    socials: Array<{ social: SocialType; link: string; username: string }> 
}) {
    return (
        <div className='social-button-wrapper'>
            {socials.map((item, index) => (
                <SocialButton
                    key={`${item.social}-${item.username}-${index}`}
                    social={item.social}
                    link={item.link}
                    username={item.username}
                />
            ))}
        </div>
    );
}