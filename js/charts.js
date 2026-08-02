document.addEventListener('DOMContentLoaded', async function () {
    const canvas = document.getElementById('classActivityChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    function getColors() {
        const isLight = document.body.classList.contains('light-mode');
        return {
            textColor: isLight ? '#1f2937' : '#f3f4f6',
            gridColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)'
        };
    }
    let initialColors = getColors();
    const classActivityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Lượt Xem',
                    data: [],
                    backgroundColor: function(context) {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        if (!chartArea) return '#0284c7';
                        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        gradient.addColorStop(0, '#0369a1');
                        gradient.addColorStop(1, '#38bdf8');
                        return gradient;
                    },
                    borderColor: '#7dd3fc',
                    borderWidth: 1.5,
                    borderRadius: 12,
                    barPercentage: 0.3,
                    categoryPercentage: 0.7,
                    yAxisID: 'y'
                },
                {
                    label: 'Thư Viện',
                    data: [],
                    backgroundColor: function(context) {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        if (!chartArea) return '#059669';
                        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        gradient.addColorStop(0, '#047857');
                        gradient.addColorStop(1, '#34d399');
                        return gradient;
                    },
                    borderColor: '#6ee7b7',
                    borderWidth: 1.5,
                    borderRadius: 12,
                    barPercentage: 0.3,
                    categoryPercentage: 0.7,
                    yAxisID: 'y'
                },
                {
                    label: 'Thành Tích',
                    data: [],
                    backgroundColor: function(context) {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        if (!chartArea) return '#d97706';
                        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        gradient.addColorStop(0, '#b45309');
                        gradient.addColorStop(1, '#fbbf24');
                        return gradient;
                    },
                    borderColor: '#fde68a',
                    borderWidth: 1.5,
                    borderRadius: 12,
                    barPercentage: 0.3,
                    categoryPercentage: 0.7,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12, boxHeight: 12, borderRadius: 6,
                        font: { family: 'inherit', size: 11, weight: '700' },
                        color: initialColors.textColor, padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12, weight: '600' },
                    padding: 12, cornerRadius: 10, displayColors: true,
                    borderColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 1
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 11, weight: '700' }, color: initialColors.textColor } },
                y: {
                    type: 'linear', display: true, position: 'left', beginAtZero: true,
                    grid: { color: initialColors.gridColor },
                    ticks: { font: { size: 10, weight: '600' }, color: initialColors.textColor, stepSize: 1, precision: 0 }
                }
            }
        }
    });
    const observer = new MutationObserver(() => {
        const updatedColors = getColors();
        classActivityChart.options.plugins.legend.labels.color = updatedColors.textColor;
        classActivityChart.options.scales.x.ticks.color = updatedColors.textColor;
        classActivityChart.options.scales.y.ticks.color = updatedColors.textColor;
        classActivityChart.options.scales.y.grid.color = updatedColors.gridColor;
        classActivityChart.update();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    async function trackAndLoadData(shouldIncrement = false) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const isMemberLoggedIn = localStorage.getItem('class_unlocked') === 'true';
            const [galleryRes, achievementsRes] = await Promise.all([
                supabaseClient.from('gallery').select('*', { count: 'exact', head: true }),
                supabaseClient.from('achievements').select('*', { count: 'exact', head: true })
            ]);
            const totalGallery = galleryRes.error ? 0 : (galleryRes.count || 0);
            const totalAchievements = achievementsRes.error ? 0 : (achievementsRes.count || 0);
            const docEl = document.getElementById('total-documents');
            if (docEl) docEl.textContent = totalGallery.toLocaleString();
            const achEl = document.getElementById('total-achievements');
            if (achEl) achEl.textContent = totalAchievements.toLocaleString();
            let { data: rows, error: fetchError } = await supabaseClient
                .from('class_activities')
                .select('*')
                .eq('date', today);
            if (fetchError) {
                console.warn("Lỗi truy vấn:", fetchError.message);
            }
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
                        date: today,
                        guest_views: guestViews,
                        member_views: memberViews,
                        documents: totalGallery
                    }]);
                }
            } else if (existingData) {
                guestViews = existingData.guest_views || 0;
                memberViews = existingData.member_views || 0;
            }
            const viewStatsEl = document.getElementById('view-stats');
            if (viewStatsEl) {
                viewStatsEl.textContent = `Khách: ${guestViews.toLocaleString()} | Thành viên: ${memberViews.toLocaleString()}`;
            }
            const { data: chartRows, error: chartRowsErr } = await supabaseClient
                .from('class_activities')
                .select('*')
                .order('date', { ascending: true })
                .limit(10);
            if (!chartRowsErr && chartRows && chartRows.length > 0) {
                classActivityChart.data.labels = chartRows.map(item => {
                    if (!item.date) return '';
                    const parts = item.date.split('-');
                    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.date;
                });
                classActivityChart.data.datasets[0].data = chartRows.map(item => (item.guest_views || 0) + (item.member_views || 0));
                classActivityChart.data.datasets[1].data = chartRows.map(item => item.documents !== undefined ? item.documents : totalGallery);
                classActivityChart.data.datasets[2].data = chartRows.map(() => totalAchievements);
                classActivityChart.update();
            }
            const { data: recentDocs, error: recentErr } = await supabaseClient
                .from('gallery')
                .select('title, link')
                .order('id', { ascending: false })
                .limit(3);
            const previewContainer = document.getElementById('recentDocsPreview');
            if (previewContainer && !recentErr && recentDocs && recentDocs.length > 0) {
                previewContainer.innerHTML = recentDocs.map(doc => `
                    <a href="gallery.html#documents" class="doc-preview-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); border-radius: 8px; text-decoration: none;">
                        <span style="font-size: 0.85rem; color: var(--text-color); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 75%;">
                            <i class="ri-file-text-line" style="color: #38bdf8; margin-right: 6px;"></i> ${doc.title || 'Tài liệu lớp học'}
                        </span>
                        <span style="font-size: 0.75rem; color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 2px 8px; border-radius: 4px;">Chi tiết &rarr;</span>
                    </a>
                `).join('');
            } else if (previewContainer) {
                previewContainer.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 8px;">Chưa có tài liệu nào được đăng.</div>`;
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