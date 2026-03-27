import './SiteSection.scss';

export default function SiteSection({
    head,
    subhead,
    imgUrl,
    align = 'default',
}: {
    head: string;
    subhead: string;
    imgUrl?: string;
    align?: 'left' |'right' | 'default';
}) {
    return (
        <header className='site-section'>
            {(imgUrl && align === 'default' || align === 'left') && <img src={imgUrl}/>}

            <div className='section-content'>
                <h1>{"" + head}</h1>
                <hr />
                <p>{"" + subhead}</p>
            </div>

            {(imgUrl && align === 'right') && <img src={imgUrl}/>}
        </header>
    );
}

