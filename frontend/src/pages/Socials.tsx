import SiteHeader from "../components/SiteHeader.tsx";
import SocialButtonWrapper from "../components/SocialButton.tsx";

export default function Socials() {
    return (
        <>
            <SiteHeader 
                head="My Socials"
                subhead="links to my social media profiles and contact info"
                align="left"
                backLabel="Home"
                backLink="/"
            />

            <SocialButtonWrapper 
                socials={[
                    { social: 'discord', link: 'https://discord.gg/ghHCxWxDMG', username: 'Discord Server - llegonetwork' },
                    { social: 'email', link: 'mailto:contact@llegonetwork.dev', username: 'Email - llegonetwork' },
                    { social: 'github', link: 'https://github.com/LegoLandon7', username: 'LegoLandon7' },
                    { social: 'discord', link: 'https://discord.com/users/623964733799923733', username: 'legomaster_01' },
                    { social: 'youtube', link: 'https://youtube.com/@legomaster_01', username: 'legomaster_01' },
                    { social: 'reddit', link: 'https://reddit.com/user/legomaster_01', username: 'legomaster_01' },
                    { social: 'tiktok', link: 'https://tiktok.com/@legomaster_00', username: 'legomaster_00' },
                    { social: 'tiktok', link: 'https://tiktok.com/@thelegoguy_0', username: 'thelegoguy_0' },
                    { social: 'instagram', link: 'https://instagram.com/lego.guy0', username: 'thelegoguy_0' },
                ]}
            />
        </>
    );
}