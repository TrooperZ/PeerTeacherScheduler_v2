const pastel = (color = '#7294ad') => {
    const channels = color.match(/[\da-f]{2}/gi)?.map((value) => parseInt(value, 16)) || [114, 148, 173];
    return channels.map((channel) => Math.round(channel + (255 - channel) * 0.72).toString(16).padStart(2, '0')).join('').toUpperCase();
};

export const buildLabsWorkbook = async (labs, peerTeachers) => {
    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Labs', { views: [{ state: 'frozen', ySplit: 1 }] });
    sheet.columns = [
        { header: 'Course', key: 'course', width: 16 },
        { header: 'Time', key: 'time', width: 27 },
        { header: 'Location', key: 'location', width: 16 },
        { header: 'Instructor', key: 'professor', width: 30 },
        { header: 'Assigned PT(s)', key: 'peerTeachers', width: 26 },
    ];
    sheet.autoFilter = 'A1:E1';
    sheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        cell.alignment = { vertical: 'middle' };
    });

    [...labs].sort((a, b) => String(a.course).localeCompare(String(b.course), undefined, { numeric: true }) || String(a.section).localeCompare(String(b.section), undefined, { numeric: true })).forEach((lab) => {
        const assigned = peerTeachers.filter((pt) => lab.pt?.includes(pt.uin)).map((pt) => `${pt.firstname} ${pt.lastname}`).join(', ') || 'UNASSIGNED';
        const row = sheet.addRow({
            course: `${lab.course}-${lab.section}`,
            time: lab.time || '',
            location: lab.location || '',
            professor: lab.professor || '',
            peerTeachers: assigned,
        });
        row.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${pastel(lab.color)}` } };
            cell.alignment = { vertical: 'middle', wrapText: true };
            cell.border = { bottom: { style: 'thin', color: { argb: 'FFB8C2CC' } } };
        });
    });
    return workbook;
};

export const downloadLabsWorkbook = async (labs, peerTeachers) => {
    const workbook = await buildLabsWorkbook(labs, peerTeachers);
    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'labs.xlsx';
    link.click();
    URL.revokeObjectURL(url);
};

export const buildPTWorkbook = async (labs, peerTeachers, changes = []) => {
    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('PT schedule', { views: [{ state: 'frozen', ySplit: 1 }] });
    sheet.columns = [
        { header: 'Peer teacher', key: 'name', width: 28 }, { header: 'Course and section', key: 'course', width: 22 },
        { header: 'Time', key: 'time', width: 28 }, { header: 'Location', key: 'location', width: 20 },
        { header: 'Lab hours', key: 'hours', width: 14 }, { header: 'Total assigned hours', key: 'total', width: 23 },
    ];
    for (const pt of peerTeachers) {
        const assigned = labs.filter((lab) => lab.pt?.includes(pt.uin));
        const total = assigned.reduce((sum, lab) => sum + Number(lab.hours || 0), 0);
        if (!assigned.length) sheet.addRow({ name: `${pt.firstname} ${pt.lastname}`, total });
        for (const lab of assigned) sheet.addRow({ name: `${pt.firstname} ${pt.lastname}`, course: `${lab.course}-${lab.section}`, time: lab.time, location: lab.location, hours: lab.hours, total });
    }
    sheet.getRow(1).font = { bold: true };
    const changeSheet = workbook.addWorksheet('Assignment changes');
    changeSheet.columns = [{ header: 'Changes since last JSON export or load', key: 'change', width: 90 }];
    changeSheet.getRow(1).font = { bold: true };
    changes.forEach((change) => changeSheet.addRow({ change }));
    return workbook;
};

export const downloadPTWorkbook = async (labs, peerTeachers, changes) => {
    const workbook = await buildPTWorkbook(labs, peerTeachers, changes);
    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pt-schedule.xlsx';
    link.click();
    URL.revokeObjectURL(url);
};
