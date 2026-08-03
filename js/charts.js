document.addEventListener('DOMContentLoaded', async function () {
    const canvas = document.getElementById('classActivityChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    function getColors() {
        const isLight = document.body.classList.contains('light-mode');
        return {
            textColor: isLight ? '#1f2937' : '#f8fafc'
        };
    }
    let initialColors = getColors();
    const classActivityChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Lượt Khách', 'Lượt Thành Viên', 'Thư Viện', 'Thành Tích'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    'rgba(56, 189, 248, 0.85)',
                    'rgba(14, 165, 233, 0.95)',
                    'rgba(52, 211, 153, 0.85)',
                    'rgba(251, 191, 36, 0.85)'
                ],
                borderColor: 'rgba(255, 255, 255, 0.15)',
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            animation: {
                animateScale: true,
                animateRotate: true
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 14, 
                        boxHeight: 14, 
                        borderRadius: 7,
                        font: { family: 'inherit', size: 12, weight: '700' },
                        color: initialColors.textColor, 
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13, weight: '600' },
                    padding: 14, 
                    cornerRadius: 12, 
                    displayColors: true,
                    borderColor: 'rgba(255, 255, 255, 0.15)', 
                    borderWidth: 1
                }
            }
        }
    });
    const observer = new MutationObserver(() => {
        const updatedColors = getColors();
        classActivityChart.options.plugins.legend.labels.color = updatedColors.textColor;
        classActivityChart.update();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    if (!document.getElementById('svg-border-anim-style')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'svg-border-anim-style';
        styleEl.innerHTML = `
            @keyframes svgPauseLoop {
                0% { stroke-dashoffset: 300; }
                80% { stroke-dashoffset: 0; }
                100% { stroke-dashoffset: 0; }
            }
            .svg-btn-wrapper {
                position: relative;
                display: inline-block;
                border-radius: 10px;
                overflow: hidden;
            }
            .svg-btn-wrapper svg {
                position: absolute;
                top: 0; left: 0;
                width: 100%; height: 100%;
                pointer-events: none;
                border-radius: 10px;
            }
            .svg-btn-wrapper .animated-path {
                fill: none;
                stroke-width: 2px;
                stroke-dasharray: 60, 240;
                stroke-linecap: round;
                animation: svgPauseLoop 2.5s ease-in-out infinite;
            }
        `;
        document.head.appendChild(styleEl);
    }
    async function trackAndLoadData(shouldIncrement = false) {
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const isMemberLoggedIn = localStorage.getItem('class_unlocked') === 'true';
            const [galleryRes, achievementsRes] = await Promise.all([
                supabaseClient.from('gallery').select('*', { count: 'exact', head: true }),
                supabaseClient.from('achievements').select('*', { count: 'exact', head: true })
            ]);
            const totalGallery = galleryRes.error ? 0 : (galleryRes.count || 0);
            const totalAchievements = achievementsRes.error ? 0 : (achievementsRes.count || 0);
            let { data: rows } = await supabaseClient.from('class_activities').select('*').eq('date', todayStr);
            let existingData = (rows && rows.length > 0) ? rows[0] : null;
            let guestViews = existingData ? (existingData.guest_views || 0) : 0;
            let memberViews = existingData ? (existingData.member_views || 0) : 0;
            if (shouldIncrement) {
                if (isMemberLoggedIn) {
                    memberViews += 1;
                } else {
                    guestViews += 1;
                }
                if (existingData) {
                    await supabaseClient.from('class_activities').update({
                        guest_views: guestViews,
                        member_views: memberViews,
                        documents: totalGallery
                    }).eq('id', existingData.id);
                } else {
                    await supabaseClient.from('class_activities').insert([{
                        date: todayStr,
                        guest_views: guestViews,
                        member_views: memberViews,
                        documents: totalGallery
                    }]);
                }
            }
            const { data: chartRows } = await supabaseClient
                .from('class_activities')
                .select('*')
                .order('date', { ascending: false })
                .limit(10);
            let totalGuestViews = 0;
            let totalMemberViews = 0;
            let oldestDate = '--/--/----';
            let newestDate = '--/--/----';
            if (chartRows && chartRows.length > 0) {
                chartRows.forEach(item => {
                    totalGuestViews += (item.guest_views || 0);
                    totalMemberViews += (item.member_views || 0);
                });
                const sortedRows = chartRows.sort((a, b) => new Date(a.date) - new Date(b.date));
                const formatDate = (dStr) => {
                    if (!dStr) return '--/--/----';
                    const parts = dStr.split('-');
                    return `${parts[2]}/${parts[1]}/${parts[0]}`;
                };
                oldestDate = formatDate(sortedRows[0].date);
                newestDate = formatDate(sortedRows[sortedRows.length - 1].date);
            }
            const totalViews = totalGuestViews + totalMemberViews;
            classActivityChart.data.datasets[0].data = [totalGuestViews, totalMemberViews, totalGallery, totalAchievements];
            classActivityChart.update();
            let dateRangeEl = document.getElementById('date-range');
            if (!dateRangeEl) {
                const titleEl = document.querySelector('h2, .section-title, [style*="Thống Kê"]');
                if (titleEl) {
                    dateRangeEl = document.createElement('div');
                    dateRangeEl.id = 'date-range';
                    dateRangeEl.style.cssText = 'font-size: 0.85rem; color: var(--text-muted, #94a3b8); margin: 6px 0 12px 0; font-weight: 500;';
                    titleEl.parentNode.insertBefore(dateRangeEl, titleEl.nextSibling);
                }
            }
            if (dateRangeEl) {
                dateRangeEl.innerHTML = `Từ ngày: <span style="color: var(--text-color); font-weight: 600;">${oldestDate} đến ${newestDate}</span>`;
            }
            const guestEl = document.getElementById('stat-guest-views');
            const memberEl = document.getElementById('stat-member-views');
            if (guestEl) guestEl.innerText = totalGuestViews.toLocaleString();
            if (memberEl) memberEl.innerText = totalMemberViews.toLocaleString();
            const viewStatsEl = document.getElementById('view-stats');
            if (viewStatsEl) {
                const viewTitleSpan = viewStatsEl.querySelector('.ri-eye-line');
                if (viewTitleSpan && viewTitleSpan.parentNode) {
                    viewTitleSpan.parentNode.innerHTML = `<i class="ri-eye-line" style="color: #38bdf8; font-size: 1rem;"></i> Phân Loại Lượt Xem (${totalViews.toLocaleString()})`;
                }
            }
            const [docsDataRes, imagesDataRes, achievementsDataRes] = await Promise.all([
                supabaseClient.from('gallery').select('title, link').is('image_url', null).order('id', { ascending: false }).limit(3),
                supabaseClient.from('gallery').select('title, link').not('image_url', 'is', null).order('id', { ascending: false }).limit(3),
                supabaseClient.from('achievements').select('title, student_name, link').order('id', { ascending: false }).limit(3)
            ]);
            const recentDocs = docsDataRes.data || [];
            const recentImages = imagesDataRes.data || [];
            const recentAchievements = achievementsDataRes.data || [];
            const previewContainer = document.getElementById('recentDocsPreview');
            if (previewContainer && recentDocs.length > 0) {
                previewContainer.innerHTML = `
                    <div style="background: rgba(255, 255, 255, 0.06); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); margin-top: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-color); display: flex; align-items: center; gap: 8px;">
                                <i class="ri-file-text-line" style="color: #38bdf8; font-size: 1.1rem;"></i> Tài Liệu Mới
                            </div>
                            <a href="gallery.html#documents" class="dynamic-text-color" style="font-size: 0.82rem; text-decoration: none; font-weight: 600; opacity: 0.9;">Xem tất cả &rarr;</a>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${recentDocs.map(doc => `
                                <a href="gallery.html#documents" class="doc-preview-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; text-decoration: none;">
                                    <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70%; display: flex; align-items: center; gap: 8px;">
                                        <i class="ri-file-list-line" style="color: #38bdf8; font-size: 1rem;"></i> ${doc.title || 'Tài liệu học tập'}
                                    </span>
                                    <div class="svg-btn-wrapper">
                                        <span style="display: inline-block; font-size: 0.78rem; color: #38bdf8; padding: 5px 14px; font-weight: 800;">Chi tiết &rarr;</span>
                                        <svg viewBox="0 0 100 36" preserveAspectRatio="none">
                                            <rect x="1" y="1" width="98" height="34" rx="8" class="animated-path" stroke="#38bdf8" />
                                        </svg>
                                    </div>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            let imagesContainer = document.getElementById('recentImagesPreview');
            if (!imagesContainer && previewContainer) {
                imagesContainer = document.createElement('div');
                imagesContainer.id = 'recentImagesPreview';
                previewContainer.parentNode.insertBefore(imagesContainer, previewContainer.nextSibling);
            }
            if (imagesContainer && recentImages.length > 0) {
                imagesContainer.innerHTML = `
                    <div style="background: rgba(255, 255, 255, 0.06); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); margin-top: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-color); display: flex; align-items: center; gap: 8px;">
                                <i class="ri-image-line" style="color: #34d399; font-size: 1.1rem;"></i> Ảnh Mới
                            </div>
                            <a href="gallery.html#images" class="dynamic-text-color" style="font-size: 0.82rem; text-decoration: none; font-weight: 600; opacity: 0.9;">Xem tất cả &rarr;</a>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${recentImages.map(img => `
                                <a href="gallery.html#images" class="doc-preview-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; text-decoration: none;">
                                    <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70%; display: flex; align-items: center; gap: 8px;">
                                        <i class="ri-image-2-line" style="color: #34d399; font-size: 1rem;"></i> ${img.title || 'Khoảnh khắc kỷ niệm'}
                                    </span>
                                    <div class="svg-btn-wrapper">
                                        <span style="display: inline-block; font-size: 0.78rem; color: #34d399; padding: 5px 14px; font-weight: 800;">Chi tiết &rarr;</span>
                                        <svg viewBox="0 0 100 36" preserveAspectRatio="none">
                                            <rect x="1" y="1" width="98" height="34" rx="8" class="animated-path" stroke="#34d399" />
                                        </svg>
                                    </div>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            let achievementsContainer = document.getElementById('recentAchievementsPreview');
            if (!achievementsContainer && imagesContainer) {
                achievementsContainer = document.createElement('div');
                achievementsContainer.id = 'recentAchievementsPreview';
                imagesContainer.parentNode.insertBefore(achievementsContainer, imagesContainer.nextSibling);
            }
            if (achievementsContainer && recentAchievements.length > 0) {
                achievementsContainer.innerHTML = `
                    <div style="background: rgba(255, 255, 255, 0.06); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); margin-top: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-color); display: flex; align-items: center; gap: 8px;">
                                <i class="ri-trophy-line" style="color: #fbbf24; font-size: 1.1rem;"></i> Thành Tích Mới
                            </div>
                            <a href="achievements.html" class="dynamic-text-color" style="font-size: 0.82rem; text-decoration: none; font-weight: 600; opacity: 0.9;">Xem tất cả &rarr;</a>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${recentAchievements.map(ach => `
                                <a href="achievements.html" class="doc-preview-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; text-decoration: none;">
                                    <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70%; display: flex; align-items: center; gap: 8px;">
                                        <i class="ri-award-line" style="color: #fbbf24; font-size: 1rem;"></i> ${ach.student_name ? `${ach.student_name} - ` : ''}${ach.title || 'Thành tích lớp học'}
                                    </span>
                                    <div class="svg-btn-wrapper">
                                        <span style="display: inline-block; font-size: 0.78rem; color: #fbbf24; padding: 5px 14px; font-weight: 800;">Chi tiết &rarr;</span>
                                        <svg viewBox="0 0 100 36" preserveAspectRatio="none">
                                            <rect x="1" y="1" width="98" height="34" rx="8" class="animated-path" stroke="#fbbf24" />
                                        </svg>
                                    </div>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        } catch (err) {
            console.error("Lỗi đồng bộ dữ liệu thống kê:", err);
        }
    }
    trackAndLoadData(true);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            trackAndLoadData(true);
        }
    });
});