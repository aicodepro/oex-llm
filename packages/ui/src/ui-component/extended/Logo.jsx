import { useSelector } from 'react-redux'

// ==============================|| LOGO ||============================== //

const Logo = () => {
    const customization = useSelector((state) => state.customization)

    return (
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row' }}>
            <img
                style={{ objectFit: 'contain', height: 'auto', width: 70 }}
                // src={customization.isDarkMode ? logoDark : logo}
                src='aicodeproLogo.png'
                alt='AicodePro'
            />
            <p style={{ position: 'relative', fontSize: '23px', marginBottom: '0px', marginTop: '26px', fontWeight: '700', left: '-8px' }}>
                <span style={{ color: '#4a3889', margin: '0px' }}>Aicode</span>
                <span style={{ color: '#ffaa00', margin: '0px' }}>pro</span>
            </p>
        </div>
    )
}

export default Logo
