import './InfoBlock.css'
import { Link } from 'react-router-dom'

function InfoBlock({
    header      = null,
    headerPos   = 'left',   // 'left' | 'center' | 'right'
    buttons     = [],
    description = null,
    img         = null,
    imgPos      = 'left',   // 'left' | 'right' | 'top' | 'bottom'
    notes       = [],
    maxWidth    = null,
    maxHeight   = null,
    grow        = null,
    divider     = true,
}) {
    const flexDir =
        imgPos === 'top'    ? 'column'         :
        imgPos === 'bottom' ? 'column-reverse' :
        imgPos === 'right'  ? 'row-reverse'    :
                              'row'

    const imgIsVertical = imgPos === 'top' || imgPos === 'bottom'

    return (
        <div
            className="info-block"
            style={{
                flexDirection: flexDir,
                ...(maxWidth  && { maxWidth }),
                ...(maxHeight && { maxHeight }),
                ...(grow      && { flex: grow, minWidth: 0 }),
            }}
        >
            {img && (
                <img
                    className="info-img"
                    src={img}
                    alt={header || ''}
                    style={{ width: imgIsVertical ? '60%' : undefined }}
                />
            )}

            <div className="info-body">
                {(header || buttons.length > 0) && (
                    <div className={`info-header-row pos-${headerPos}`}>
                        {header && <h2>{header}</h2>}
                        {buttons.length > 0 && (
                            <div className="info-buttons">
                                {buttons.map((btn, i) => (
                                    <Link key={i} to={btn.to} className="info-button">
                                        {btn.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {divider && <div className="info-divider" />}

                {description && <p className="info-description">{description}</p>}

                {notes.length > 0 && (
                    <dl className="info-notes">
                        {notes.map((note, i) => (
                            <div key={i} className="info-note">
                                <dt>{note.label}</dt>
                                <dd>
                                    {note.link
                                        ? <a href={note.link} target="_blank" rel="noopener noreferrer">{note.text}</a>
                                        : note.text
                                    }
                                </dd>
                            </div>
                        ))}
                    </dl>
                )}
            </div>
        </div>
    )
}

export default InfoBlock