import './SiteHeader.scss';

export default function SiteHeader({
    head,
    subhead,
    backLabel,
    backLink,
    iconUrl,
    align = 'default',
}: {
    head?: string;
    subhead?: string;
    backLabel?: string;
    backLink?: string;
    iconUrl?: string;
    align?: 'left' | 'center' | 'right' | 'default';
}) {
    const alignItems =
        align === 'center' ? 'center' :
        align === 'right'  ? 'flex-end' :
        'flex-start';

    return (
        <header className='site-header' style={{ alignItems }}>

            {(backLink && backLabel) && <a href={backLink}>{"< " + backLabel}</a>}

            <div className='header-content'>
                {iconUrl && <img src={iconUrl} className='header-icon' />}
                <h1>{"" + head}</h1>
            </div>

            {subhead && <p>{"" + subhead}</p>}

            <hr />
        </header>
    );
}