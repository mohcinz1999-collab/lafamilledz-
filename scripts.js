// توكن الوصول الخاص بتطبيقك
const accessToken = "GG|861408493498529|MGjnNcG-1aO02ljjLLK20w7k2RY"; // توكن الوصول الخاص بك

document.getElementById('chat-btn').addEventListener('click', function() {
    // افتح واجهة الدردشة هنا
    alert("تم اختيار دردشة جماعية");
});

document.getElementById('posts-btn').addEventListener('click', function() {
    // إخفاء الأزرار
    document.querySelectorAll('.option').forEach(function(element) {
        element.style.display = 'none';
    });

    // إظهار قسم المنشورات
    document.getElementById('posts-section').style.display = 'block';

    // جلب منشورات المجموعة باستخدام Graph API
    fetchFacebookPosts();
});

function fetchFacebookPosts() {
    const groupId = "2134361100431197"; // معرف المجموعة
    const accessToken = "GG|861408493498529|MGjnNcG-1aO02ljjLLK20w7k2RY"; // توكن الوصول الخاص بك

    fetch(`https://graph.facebook.com/${groupId}/feed?access_token=${accessToken}`)
        .then(response => response.json())
        .then(data => {
            const postsContainer = document.getElementById('posts-container');
            postsContainer.innerHTML = '';  // إفراغ القسم قبل إضافة المنشورات

            data.data.forEach(post => {
                let postElement = document.createElement('div');
                postElement.classList.add('post');
                postElement.innerHTML = `
                    <h3>منشور:</h3>
                    <p>${post.message || 'لا يوجد نص للمنشور'}</p>
                    <p><strong>تاريخ النشر:</strong> ${new Date(post.created_time).toLocaleString()}</p>
                `;
                postsContainer.appendChild(postElement);
            });
        })
        .catch(error => {
            console.error('خطأ في استرجاع المنشورات:', error);
            alert('حدث خطأ أثناء تحميل المنشورات');
        });
}