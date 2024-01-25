// CSRF対策
axios.defaults.xsrfHeaderName = "X-CSRFTOKEN"
axios.defaults.xsrfCookieName = "csrftoken";
// 日本標準時に変換してフォーマット
function formatDateTime(date) {
    if (!(date instanceof Date)) {
        // もし date が Date オブジェクトでなければ、Date オブジェクトに変換
        date = new Date(date);
    }

    var year = date.getFullYear();
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);
    var hours = ('0' + date.getHours()).slice(-2);
    var minutes = ('0' + date.getMinutes()).slice(-2);

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}


document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek",
        },
        locale: "ja",
        selectable: true,
        contentHeight: 'auto',
        select: function (info) {
            // Bootstrapのモーダルを表示
            $('#eventModal').modal('show');
            // 選択された日付を適切なフォーマットに変換
            var startDateTime = formatDateTime(info.start);
            var endDateTime = formatDateTime(info.end);
            // ダイアログ内の日付入力フィールドにセット
            document.getElementById('eventName').value = ''
            document.getElementById('eventDescription').value = ''
            document.getElementById('eventStartDate').value = startDateTime;
            document.getElementById('eventEndDate').value = endDateTime;
            // 閉じるボタンの設定
            $('#closeBtn').on('click', function () {
                $('#eventModal').modal('hide');
                // イベントハンドラのアンバインディング
                $('#saveEventBtn').off('click');
            });
            
            // 以前のハンドラをアンバインディング
            $('#saveEventBtn').off('click');
            
            // 新しいハンドラをバインド
            $('#saveEventBtn').on('click', function () {
                saveEvent();
                $('#eventModal').modal('hide');
            });
            
        },
        events: function (info, successCallback) {
            axios
                .post("/sc/list/", {
                    start_date: formatDateTime(info.start),
                    end_date: formatDateTime(info.end),
                })
                .then((response) => {
                    // console.log(response.data);  // レスポンスの内容を確認
                    calendar.removeAllEvents();
                    successCallback(response.data);
                })
                .catch((error) => {
                    // console.error(error);  // エラーをコンソールに表示
                    alert("登録に失敗しました");
                });
        },
        eventClick: function (info) {
            $('#detailModal').modal('show');
            var event = info.event;
            const nowLocal = new Date()

            // UTCとローカルタイムゾーンとの差を取得し、分からミリ秒に変換
            const diff = nowLocal.getTimezoneOffset() * 60 * 1000

            const usestartdate = new Date(event.start - diff)
            const useenddate = new Date(event.end - diff)  
            document.getElementById('editEventName').value = event.title;
            document.getElementById('editEventDescription').value = event.extendedProps.description;
            document.getElementById('editEventStartDate').value = usestartdate.toISOString().slice(0, 16);
            document.getElementById('editEventEndDate').value = useenddate.toISOString().slice(0, 16);
                // 閉じるボタンの設定
                $('#closeBtn2').on('click', function () {
                    $('#detailModal').modal('hide');
                    // イベントハンドラのアンバインディング
                    $('#saveEditEventBtn').off('click');
                    $('#deleteEventBtn').off('click');
                });
                
                // 以前のハンドラをアンバインド
                $('#saveEditEventBtn').off('click');
                $('#deleteEventBtn').off('click');
                
                // 新しいハンドラをバインド
                $('#saveEditEventBtn').on('click', function () {
                    saveEditEvent(info);
                    $('#detailModal').modal('hide');
                });
                
                $('#deleteEventBtn').on('click', function () {
                    deleteEvent(info);
                    $('#detailModal').modal('hide');
                });
        }
    });
        
                

    calendar.render();

    // 予定を保存する関数
    function saveEvent() {
        const eventName = document.getElementById('eventName').value;
        const eventDescription = document.getElementById('eventDescription').value;
        const eventStartDate = document.getElementById('eventStartDate').value.valueOf();
        const eventEndDate = document.getElementById('eventEndDate').value.valueOf();
        axios
            .post("/sc/add/", {
                start_date: eventStartDate,
                end_date: eventEndDate,
                event_name: eventName,
                event_description: eventDescription,
            })
            .then(() => {
                calendar.addEvent({
                    title: eventName,
                    start: eventStartDate,
                    end: eventEndDate,
                    extendedProps:{    
                        description: eventDescription,
                    },
                    allDay: false,
                });
                alert("登録しました");
                location.reload();
            })
            .catch((error) => {
                console.error(error);
                alert("登録に失敗しました");
            });
    }



    function deleteEvent(info) {
            const eventId = info.event.extendedProps.id;
            axios
                .post("/sc/delete/", {
                    event_id: eventId,
                })
                .then(() => {
                    info.event.remove();
                    alert("削除しました");
                })
                .catch(() => {
                    alert("削除に失敗しました");
                });
            };

    //編集した予定を保存する関数
    function saveEditEvent(info) {
            const eventId = info.event.extendedProps.id;
            const editEventName = document.getElementById('editEventName').value;
            const editEventDescription = document.getElementById('editEventDescription').value;
            const editEventStartDate = document.getElementById('editEventStartDate').value.valueOf();
            const editEventEndDate = document.getElementById('editEventEndDate').value.valueOf();
                
            axios
                .post("/sc/edit/", {
                    event_id: eventId,
                    edit_event_name: editEventName,
                    edit_event_description: editEventDescription,
                    edit_event_start_date: editEventStartDate,
                    edit_event_end_date: editEventEndDate,
                })
                .then(() => {
                    // カレンダー上でイベントを更新
                    info.event.setProp('title', editEventName);
                    info.event.setExtendedProp('description', editEventDescription);
                    info.event.setDates(editEventStartDate, editEventEndDate);
            
                    // モーダルを閉じる
                    $('#detailModal').modal('hide');
                     alert('更新しました');
                })
                .catch((error) => {
                    alert("更新に失敗しました");
                    console.error(error);
                });
    }
                        
});