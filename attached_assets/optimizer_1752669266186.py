import os
import re
import time
import json
import logging
import google.generativeai as genai
from django.core.cache import cache
from backend.key_word.models import Keyword
from backend.content.models import BlogContent, MorphemeAnalysis
from .morpheme_analyzer import MorphemeAnalyzer

logger = logging.getLogger(__name__)

class ContentOptimizer:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY 환경 변수가 설정되지 않았습니다.")
        genai.configure(api_key=self.api_key)
        self.gemini_model = genai.GenerativeModel('gemini-1.5-pro-latest')
        self.morpheme_analyzer = None  # 지연 초기화를 위해 None으로 설정

    def get_morpheme_analysis_for_prompt(self, keyword_obj, analysis_result, custom_morphemes):
        morpheme_analysis_for_prompt = {
            "target_morphemes": analysis_result['morpheme_analysis']['target_morphemes'],
            "counts": analysis_result['morpheme_analysis']['counts']
        }

        base_morphemes = analysis_result['morpheme_analysis']['target_morphemes']['base']
        compound_morphemes = analysis_result['morpheme_analysis']['target_morphemes']['compound']
        target_min_base = self.morpheme_analyzer.target_min_base_count
        target_max_base = self.morpheme_analyzer.target_max_base_count
        target_min_compound = self.morpheme_analyzer.target_min_compound_count
        target_max_compound = self.morpheme_analyzer.target_max_compound_count

        morpheme_instructions = []
        if base_morphemes:
            morpheme_instructions.append(f"핵심 기본 형태소 ({', '.join(base_morphemes)}): 각각 {target_min_base}-{target_max_base}회")
        if compound_morphemes:
            morpheme_instructions.append(f"복합 키워드/구문 ({', '.join(compound_morphemes)}): 각각 {target_min_compound}-{target_max_compound}회")
        
        morpheme_instruction_text = " 및 ".join(morpheme_instructions)

        return morpheme_analysis_for_prompt, morpheme_instruction_text

    def generate_perplexity_references(self, keyword):
        logger.info(f"'{keyword}'에 대한 퍼플렉시티 참고자료 생성을 시작합니다.")
        variations = [
            keyword,
            f"{keyword} 종류",
            f"{keyword} 추천",
            f"{keyword} 비교",
            f"{keyword} 가격"
        ]
        
        references_html = "<!-- 퍼플렉시티 참고 자료 -->\n"
        references_html += "<h2>함께 보면 좋은 글</h2>\n"
        references_html += "<ul>\n"
        
        for variation in variations:
            search_url = f"https://www.perplexity.ai/search/?q={variation.replace(' ', '%20')}"
            references_html += f'<li><a href="{search_url}" target="_blank">{variation} 관련 정보 더 찾아보기</a></li>\n'
            
        references_html += "</ul>\n"
        logger.info(f"'{keyword}'에 대한 퍼플렉시티 참고자료 생성 완료.")
        return references_html

    def _create_ultra_seo_prompt_v2(self, content, char_count, morpheme_analysis_for_prompt, morpheme_instruction_text):
        target_min_chars = self.morpheme_analyzer.target_min_chars
        target_max_chars = self.morpheme_analyzer.target_max_chars

        prompt_template = """
        이 블로그 글을 완전한 최적화 기준에 맞추어 재구성해 주세요. 최고의 SEO 성능을 위한 명확한 지침을 따라주세요:
        1️⃣ **[매우 중요] 글자수 절대 준수**:
        • **반드시** 최종 글자수(공백 제외)를 **{target_min_chars}자에서 {target_max_chars}자 사이**로 맞춰야 합니다. 이 범위를 벗어나는 것은 허용되지 않습니다.
        • 현재 글자수: {char_count}자

        2️⃣ **[매우 중요] 형태소 빈도 절대 준수**:
        • 아래 목록의 각 형태소가 **지정된 목표 횟수 범위 내**에 정확히 포함되도록 글을 재구성해야 합니다. 하나라도 범위를 벗어나면 안 됩니다.
        • 목표: {morpheme_instruction_text}
        • 현재 목표 형태소 분석 결과:
        {morpheme_json}

        3️⃣ 키워드 및 형태소 카운팅 방식:
           - 핵심 기본 형태소 (예: '엔진', '오일', '종류'): 문장 내에서 부분적으로 포함되어도 카운트됩니다. (예: '엔진오일종류'에서 '엔진' 1회, '오일' 1회, '종류' 1회)
           - 복합 키워드 및 구문 (예: '엔진오일', '엔진오일종류'): 정확히 해당 구문이 일치해야 카운트됩니다.

        4️⃣ 구조 최적화 (정확히 적용):
        • 첫 문단에 반드시 키워드와 그 변형어 포함
        • 모든 H2/H3 제목에 키워드 관련 용어 포함
        5️⃣ **[절대 규칙] 추가 지침**:
        • **절대** 원본 글의 스타일과 어조를 바꾸지 마세요. 블로그의 정체성을 유지해야 합니다.
        • **절대** 글의 주제나 핵심 주장을 변경하지 마세요. 정보의 정확성이 가장 중요합니다.
        • **절대** HTML 태그를 사용하지 마세요. 순수 텍스트로만 작성해야 합니다.
        • **[매우 중요] 절대 '참고 자료', '관련 글', '출처', '더 읽어보기' 등과 같은 섹션을 본문에 만들지 마세요. 오직 블로그 본문 내용만 작성해야 합니다.**

        6️⃣ 모바일 최적화:
        • 4-5줄 이내의 짧은 문단
        • 복잡한 문장 단순화
        • 모바일에서 빠르게 스캔 가능한 형식

        7️⃣ 핵심 콘텐츠 구조:
        • 서론: 핵심 키워드로 시작, 독자 니즈 언급
        • 본론: 문제점과 해결책 제시
        • 결론: 핵심 키워드로 정리, 행동 유도

        원본 콘텐츠:
        {content}

        최적화된 콘텐츠만 제공해 주세요. 설명이나 메모는 포함하지 마세요.
        """
        return prompt_template.format(
            target_min_chars=target_min_chars,
            target_max_chars=target_max_chars,
            char_count=char_count,
            morpheme_instruction_text=morpheme_instruction_text,
            morpheme_json=json.dumps(morpheme_analysis_for_prompt, ensure_ascii=False, indent=2),
            content=content
        )

    def optimize_existing_content_v3(self, content_id, custom_morphemes=None):
        if self.morpheme_analyzer is None:
            self.morpheme_analyzer = MorphemeAnalyzer()

        cache_key = f'content_optimization_{content_id}'
        cache.set(cache_key, {'status': 'processing', 'progress': 0, 'message': '최적화 프로세스를 시작합니다.'}, timeout=3600)

        try:
            content_obj = BlogContent.objects.get(id=content_id)
            keyword_obj = content_obj.keyword
            logger.info(f"V3 최적화 시작: BlogContent ID {content_id}, Keyword: {keyword_obj.keyword}")
            cache.set(cache_key, {'status': 'processing', 'progress': 10, 'message': '콘텐츠 및 키워드 정보를 로드했습니다.'}, timeout=3600)

            # 초기 분석
            initial_analysis = self.morpheme_analyzer.analyze_for_seo(content_obj.content, keyword_obj)
            char_count = len(content_obj.content.replace(" ", ""))

            # 프롬프트 생성용 데이터 준비
            morpheme_analysis_for_prompt, morpheme_instruction_text = self.get_morpheme_analysis_for_prompt(keyword_obj, initial_analysis, custom_morphemes or [])
            logger.info(f"초기 콘텐츠 분석 완료. 글자수: {char_count}")

            max_attempts = 5
            is_optimized = False
            optimized_content = content_obj.content # 초기 콘텐츠로 시작
            validation_result = initial_analysis # 초기 분석 결과로 시작

            for attempt in range(1, max_attempts + 1):
                logger.info(f"최적화 시도 {attempt}/{max_attempts}...")
                cache.set(cache_key, {'status': 'processing', 'progress': 15 + (attempt * 10), 'message': f'최적화 시도 {attempt}/{max_attempts}'}, timeout=3600)

                # 현재 콘텐츠와 분석 결과를 바탕으로 프롬프트 생성
                prompt = self._create_ultra_seo_prompt_v2(optimized_content, char_count, morpheme_analysis_for_prompt, morpheme_instruction_text)
                logger.debug(f"생성된 프롬프트: {prompt[:500]}...")

                try:
                    response = self.gemini_model.generate_content(prompt)
                    newly_optimized_content = response.text.strip()
                    logger.info("Gemini API로부터 최적화된 콘텐츠를 수신했습니다.")

                    # 새로 생성된 콘텐츠를 분석
                    validation_result = self.morpheme_analyzer.analyze_for_seo(newly_optimized_content, keyword_obj)
                    new_char_count = len(newly_optimized_content.replace(" ", ""))

                    # 최적화 성공 여부 판단
                    char_count_ok = self.morpheme_analyzer.target_min_chars <= new_char_count <= self.morpheme_analyzer.target_max_chars
                    
                    base_counts = validation_result['morpheme_analysis']['counts']['base']
                    compound_counts = validation_result['morpheme_analysis']['counts']['compound']

                    base_morphemes_ok = all(self.morpheme_analyzer.target_min_base_count <= count <= self.morpheme_analyzer.target_max_base_count for count in base_counts.values())
                    compound_morphemes_ok = all(self.morpheme_analyzer.target_min_compound_count <= count <= self.morpheme_analyzer.target_max_compound_count for count in compound_counts.values())

                    if char_count_ok and base_morphemes_ok and compound_morphemes_ok:
                        is_optimized = True
                        optimized_content = newly_optimized_content # 성공한 콘텐츠를 최종본으로 확정
                        logger.info(f"최적화 성공! (시도 횟수: {attempt})")
                        cache.set(cache_key, {'status': 'processing', 'progress': 80, 'message': '콘텐츠 최적화 성공! 최종 저장 중...'}, timeout=3600)
                        break
                    else:
                        # 실패 시, 다음 시도를 위해 현재 상태 업데이트
                        optimized_content = newly_optimized_content
                        char_count = new_char_count
                        morpheme_analysis_for_prompt, morpheme_instruction_text = self.get_morpheme_analysis_for_prompt(keyword_obj, validation_result, custom_morphemes or [])
                        logger.info(f"최적화 기준 미달 (글자수:{char_count_ok}, 기본형태소:{base_morphemes_ok}, 복합형태소:{compound_morphemes_ok}). 다음 시도를 위해 콘텐츠와 분석 결과를 업데이트합니다.")
                        cache.set(cache_key, {'status': 'processing', 'progress': 25 + (attempt * 10), 'message': f'시도 {attempt} 검증 실패, 재시도합니다.'}, timeout=3600)

                except Exception as e:
                    logger.error(f"Gemini API 호출 중 오류 발생: {e}")
                    cache.set(cache_key, {'status': 'error', 'message': f'Gemini API 오류: {e}'}, timeout=3600)
                    time.sleep(5)
                    continue

            if is_optimized:
                logger.info("최종 최적화된 콘텐츠 후처리 및 퍼플렉시티 참고자료 추가를 시작합니다.")
                
                # 1. LLM이 자체적으로 생성했을 수 있는 '참고 자료' 섹션 제거
                # '참고 자료', '함께 보면 좋은 글' 등의 제목과 그 아래 내용을 모두 제거
                cleaned_content = re.sub(r'(?im)^\s*(##+|\*\*|<h5>|<h4>|<h3>|<h2>|<h1>)?\s*(참고\s*자료|함께\s*보면\s*좋은\s*글|관련\s*글|출처|더\s*읽어보기)[\s\S]*', '', optimized_content).strip()
                logger.info("LLM이 생성한 불필요한 참고 자료 섹션을 제거했습니다.")

                # 2. 퍼플렉시티 기반의 정확한 참고 자료 생성
                references = self.generate_perplexity_references(keyword_obj.keyword)
                
                # 3. 정리된 본문과 참고 자료를 결합
                final_content = f"{cleaned_content}\n\n{references}"
                
                content_obj.content = final_content
                content_obj.is_optimized = True
                content_obj.save()

                MorphemeAnalysis.objects.update_or_create(
                    blog_content=content_obj,
                    defaults={
                        'analysis_data': validation_result,
                        'is_sync': True
                    }
                )
                logger.info(f"BlogContent ID {content_id}가 성공적으로 최적화되고 저장되었습니다.")
                cache.set(cache_key, {'status': 'completed', 'progress': 100, 'message': '콘텐츠 최적화 및 저장이 완료되었습니다.'}, timeout=3600)
            else:
                logger.warning(f"최대 시도 횟수({max_attempts}) 내에 최적화에 실패했습니다. 마지막으로 생성된 콘텐츠를 저장합니다.")
                content_obj.is_optimized = False
                content_obj.save()
                cache.set(cache_key, {'status': 'failed', 'progress': 99, 'message': f'최대 시도 횟수({max_attempts}) 내에 최적화에 실패했습니다.'}, timeout=3600)

        except BlogContent.DoesNotExist:
            logger.error(f"BlogContent ID {content_id}를 찾을 수 없습니다.")
            cache.set(cache_key, {'status': 'error', 'message': f'콘텐츠 ID {content_id}를 찾을 수 없습니다.'}, timeout=3600)
        except Keyword.DoesNotExist:
            logger.error(f"콘텐츠 ID {content_id}에 연결된 키워드를 찾을 수 없습니다.")
            cache.set(cache_key, {'status': 'error', 'message': '연결된 키워드를 찾을 수 없습니다.'}, timeout=3600)
        except Exception as e:
            logger.error(f"알 수 없는 오류 발생 (content_id: {content_id}): {e}", exc_info=True)
            cache.set(cache_key, {'status': 'error', 'message': f'알 수 없는 오류: {e}'}, timeout=3600)
